const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the database connection and models
const { connectDB } = require('./database/db');
const { collegeInfo } = require('./database/schema');

// Function to parse CSV data
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Add the last value
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index];
            });
            data.push(row);
        }
    }
    
    return data;
}

async function populateColleges() {
    try {
        console.log('🔄 Starting database population...');
        
        // Connect to database
        await connectDB();
        
        console.log('✅ Database connected');
        
        // Clear existing college data
        console.log('🗑️ Clearing existing college data...');
        await collegeInfo.deleteMany({});
        console.log('✅ Existing college data cleared');
        
        // Read and parse CSV data from the attachment content
        const csvData = `email,collegeName,managerName,phone
vipul123@gmail.com,Dummy college 1,manger 1,8999741641
vipul124@gmail.com,Dummy college 2,manger 2,8999741641
vipul125@gmail.com,Dummy college 3,manger 3,8999741641
vipul126@gmail.com,Dummy college 4,manger 4,8999741641
vipul127@gmail.com,Dummy college 5,manger 5,8999741641
vipul128@gmail.com,Dummy college 6,manger 6,8999741641
aishwarya.pawar@mmit.edu.in,"MMIT, Lohgaon",Pawar Aishwarya Dattatray ,9420469462
pdszpune@gmail.com,"PCCOE, Nigdi",Prof. Santosh Pacharane,9890577774
dnyaneshwarhmane@gmail.com,Dr DY Patil ACS College Pimpri ,Dr. D. H. Mane,9898699593
kalokhegopinath@gmail.com,Siddhant college of engineering sudumbare ,Gopinath Kalokhe,9850060567
vaugad@gmail.com,Trinity Academy of Engineering Pune ,Vaibhav Augad ,9403411203
dineshsarode@gmail.com,Vp  Asc college Baramati ,Dr. Dinesh sarode.,9890202644
kashidakshy2329@gmail.com,MUCC Pimpri ,Dr. Akshay P Kashid,8983845484
ganesh.naik@dypiemr.ac.in,Dr D Y Patil Institute of Engineering management and research Akurdi Pune ,Ganesh Gorakh Naik,7709557789
sahilbagwan2772@gmail.com,SBPCOE INDAPUR ,Prof. Sahil Bagwan ,7038231231
milind.thorat@pccoer.in,"PCCOER, Ravet",Milind Thorat,9890114427
prashant.londhe@dypic.in,"ADYPSOE , Lohagaon",Prashant Londhe,9762423035
ritesh.bhokare@srttc.ac.in,Srttc - Khamshet ,Ritesh Shankar Bhokare ,9657141628
rhkadlak@mitacsc.ac.in,MIT ACSC Alandi ,Rajesh Kadlak,8421327978
amanoj7777@gmail.com,C T.Bora Shirur,Dr. Appasahe Mukund chavan ,9890819357
kishorlaw2017@gmail.com,SLC Ambegaon Pune ,Mr. Kishor Popatrao Raskar ,9730365352
vikasshelar1234@gmail.com,Lt.K.G.Kataria College Daund Dist-Pune,Dr.Vikas Shelar,9923326692
akamlapure@gmail.com,ICCS TATHAWADE ,Dr. Anil Kamlapure ,8421760276
anilbade999@gmail.com,Shri Shiv Chhatrapati College Junnar ,Dr. Anil Kisan Bade ,9766620611
paneru.umesh@gmail.com,"A.W. College, Otur",Paneru Umeshraj Padamraj ,808055212
pratimalonari.13@gmail.com,HRM Rajgurunagar ,Pratima Lonari,9975594367
ANKY5DHONE@GMAIL.COM,I²IT Hinjawadi ,Dr. Ankita Dhone ,9503376184
sparshikagawand@gmail.com,JSPMs JSCOE ,Dr.A.B Gawand ,1234567899
phatangareayushn@gmail.com,"GCOER, Avasari",Mr. M. M. Akole,9860112057
tejasb96.tb@gmail.com,Dr. B. N. P lonavala college ,Mr. Tejas Bhangare ,9096168010
adwaghmare@admin.maepune.ac.in,MIT AOE Aalandi Pune ,Atul D waghmare ,9527534822
abhangpoonam24@gmail.com,"Dr.D.Y.Patil Tecnical campus, Varale ",Poonam Bharat Abhang ,8698185500
sanjaygade472@gmail.com,"ATSS CBSCA, Chinchwad. ",Sanjay Gade ,9657796777
adityaadate.skncop@sinhgad.edu,SKNCOP Kondhwa Pune,Mr. Aditya Arun Adate,9172509964
rtakke@gmail.com,"RSCOE,  TATHAWADE ",Prof. Ravindra Takke ,8888178883
sports@dypcoeakurdi.ac.in,"DYPCOE,AKURDI ",Abaji Mane ,9767063728
vishal.pardeshi1312@gmail.com,AIT Dighi ,Vishal Pardeshi,9689514932
ankushshinde2596@gmail.com,Jaihind college of Engenering Kuran ,Mr Shinde A S,9970685824
rohit6265shinde@gmail.com,Jaihind  institute management and  research kuran , Mr.Rohit shinde ,9970056265
gore.atul@indiraicem.ac.in,"ICEM, PARANDWADI ",Atul Gore,9922980399
tamboliarif7@gmail.com,Navsahyadri  COE ,Arif Tamboli ,9960868607
santosh.jankar@vpkbiet.org,VPKBIET Baramati,Santosh Jankar,9764066133
mmakole.instru@gcoeara.ac.in,Government Engineering College Avasari ,M. M. Akole ,9860112057
0011krishnayadav@gmail.com,Alard pharmacy marunji hinjawadi,Mr. Krishna Yadav,9096997610
sports.bdkcollege@gmail.com, B. D. k.college Ghodegaon ,Popat Mane ,7517317385
sp.pansare2009@gmail.com,"AAC,manchar",Dr.sunil pansare,8329112982
umeshjagtap1975@gmail.com,College Of Engineering Malegaon Bk Baramati ,Umesh Jagtap,9890639721
sportsnmiet@gmail.com,"NMIET, Talgaon Dabhade",Rajendra Dattatray Landge,9403084538
aheramol9011@gmail.com,Dr.D.Y.Patil SCS College Akurdi ,Amol aher,9960731040
vaibhavsalunke9421@gmail.com,"SPCOET , Someshwarnagar ",Sachin Kamble ( Badminton ),70281 48361
sushma.tayde@gmail.com,"Shree Ramchandra college of engineering, Lonikan",Dr. Sushma Tayde ,9762779555
kotkarspk@gmail.com,SBPCOAD,ARYAN NEWALE, 96995 75734
s.b.pawar26@gmail.com,JSPM NTC Narhe,sachin B Pawar,8275274312
savitri.mandhare@gmail.com,Pune,Savitri Suryakant Mandhare,7822902682
dawarepriti@gmail.com,SAE Kondhwa ,Priti Daware ,8806949186
rmcsports07@gmail.com,Prof Ramkrishna More College Akurdi ,Dr Dnyaneshwar Chimate ,9970085086
lalit.choudhari@dypvp.edu.in,DYPIT Pimpri Pune,Chaudhari Lalit R.,9421004330
mcccsdpes@gmail.com,Modern college Nigdi ,Shubham shinde,9689280039
mahesh_bendbhar@yahoo.co.in,TJ COLLEGE khadaki pune ,Dr. Mahesh Bendbhar ,9762176864
kayaammulla.alc@gmail.com,"Army Law College, Pune(ALC) & Pune",Mr. Amar Jadhav,7798692727
sports1@dypatilef.com,Dr.Dypcoe Varale ,Mr.Kiran Sitaram Mali,8446653906
manpreetrathore.alc@gmail.com,"Army Law College, Pune ",Hav. Amar Jadhav (Retd.),7798692727`;
        
        console.log('📄 Parsing CSV data...');
        const colleges = parseCSV(csvData);
        console.log(`📊 Found ${colleges.length} colleges in CSV`);
        
        // Set the default password (plain text)
        const defaultPassword = '123456';
        console.log('🔐 Using default password: 123456');
        
        // Insert colleges into database
        console.log('💾 Inserting colleges into database...');
        const insertPromises = colleges.map(async (college) => {
            const newCollege = new collegeInfo({
                email: college.email,
                collegeName: college.collegeName,
                managerName: college.managerName,
                phone: parseInt(college.phone) || 0,
                password: defaultPassword,
                matchesBoys: [],
                matchesGirls: [],
                currentRoundBoys: 'round_1',
                currentRoundGirls: 'round_1',
                isMatchAllocateBoys: false,
                isMatchAllocateGirls: false,
                playerInfoIdBoys: [],
                playerInfoIdGirls: []
            });
            
            try {
                await newCollege.save();
                console.log(`✅ Added: ${college.collegeName}`);
            } catch (error) {
                console.error(`❌ Error adding ${college.collegeName}:`, error.message);
            }
        });
        
        await Promise.all(insertPromises);
        
        // Verify the count
        const totalColleges = await collegeInfo.countDocuments();
        console.log(`\n🎉 Successfully populated ${totalColleges} colleges!`);
        console.log('✅ All colleges have been added with:');
        console.log('   - Default password: 123456 (plain text)');
        console.log('   - Current round (Boys): round_1');
        console.log('   - Current round (Girls): round_1');
        console.log('   - Match allocation: false for both boys and girls');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during population:', error);
        process.exit(1);
    }
}

// Run the population
populateColleges();