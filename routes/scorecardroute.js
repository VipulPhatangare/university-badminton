const express = require("express");
const router = express.Router();
const { playerInfo, refreeInfo } = require("../models/Player");
const {registerSingles, registerDoubles, doublesBoysMatches, doublesGirlsMatches, singlesGirlsMatches, singlesBoysMatches} = require("../models/Matches")





router.get('/',(req, res)=>{
    if(req.session.refree.isScorecard){
        res.render('scorecard');
    }
});


router.get('/get-match-info', async(req, res)=>{
    try {
        // console.log(req.session.refree);
        const matchType = req.session.refree.matchType;
        const matchId = req.session.refree.matchId;

        // console.log(matchId, matchType);

        if(matchType == 'Boys Singles'){
            const match = await singlesBoysMatches.findById(matchId);
            // console.log(match);
            return res.json(match);
        }

        if(matchType == 'Girls Singles'){
            const match = await singlesGirlsMatches.findById(matchId);
            return res.json(match);
        }

        if(matchType == 'Boys Doubles'){
            const match = await doublesBoysMatches.findById(matchId);
            return res.json(match);
        }

        if(matchType == 'Girls Doubles'){
            const match = await doublesGirlsMatches.findById(matchId);
            return res.json(match);
        }

    } catch (error) {
        console.log(error);
    }
});



router.post('/update-score', async(req, res)=>{
    try {
        const { player1Point, player2Point, matchId, matchType, currentSet, server } = req.body;
        // console.log(player1Point, player2Point, matchId, matchType, currentSet, server);
        if(matchType == 'Boys Singles'){
            
           
            await singlesBoysMatches.findByIdAndUpdate(
                matchId,
                {
                    $set: {
                    [`set.${currentSet - 1}.player1Point`]: player1Point,
                    [`set.${currentSet - 1}.player2Point`]: player2Point,
                    [`set.${currentSet - 1}.serve`]: server,
                    }
                }
            );
            return res.json({ success: true});
        }

        if(matchType == 'Girls Singles'){
            
            await singlesGirlsMatches.findByIdAndUpdate(
                matchId,
                {
                    $set: {
                    [`set.${currentSet - 1}.player1Point`]: player1Point,
                    [`set.${currentSet - 1}.player2Point`]: player2Point,
                    [`set.${currentSet - 1}.serve`]: server,
                    }
                }
            );
            return res.json({ success: true});
        }

        if(matchType == 'Boys Doubles'){
            await doublesBoysMatches.findByIdAndUpdate(
                matchId,
                {
                    $set: {
                    [`set.${currentSet - 1}.player1Point`]: player1Point,
                    [`set.${currentSet - 1}.player2Point`]: player2Point,
                    [`set.${currentSet - 1}.serve`]: server,
                    }
                }
            );
            return res.json({ success: true});
        }

        if(matchType == 'Girls Doubles'){
            await doublesGirlsMatches.findByIdAndUpdate(
                matchId,
                {
                    $set: {
                    [`set.${currentSet - 1}.player1Point`]: player1Point,
                    [`set.${currentSet - 1}.player2Point`]: player2Point,
                    [`set.${currentSet - 1}.serve`]: server,
                    }
                }
            );
            return res.json({ success: true});
        }

        return res.json({ success: false});

    } catch (error) {
        console.log(error);
        return res.json({ success: false});
    }
});

router.post('/complete-set', async (req, res) => {
    try {
        const { setNumber, player1Point, player2Point, matchId, matchType, server } = req.body;
        const currentSet = setNumber;

        const set1 = {
            player1Point: 0,
            player2Point: 0,
            isSetComplete: false,
            serve: server,
        };

        let model;
        if (matchType === 'Boys Singles') model = singlesBoysMatches;
        if (matchType === 'Girls Singles') model = singlesGirlsMatches;
        if (matchType === 'Boys Doubles') model = doublesBoysMatches;
        if (matchType === 'Girls Doubles') model = doublesGirlsMatches;

        if (!model) return res.json({ success: false });

        // ✅ Step 1: Update current set
        await model.findByIdAndUpdate(
            matchId,
            {
                $set: {
                    [`set.${currentSet - 1}.player1Point`]: player1Point,
                    [`set.${currentSet - 1}.player2Point`]: player2Point,
                    [`set.${currentSet - 1}.serve`]: server,
                    [`set.${currentSet - 1}.isSetComplete`]: true,
                }
            }
        );

        // ✅ Step 2: Push new set
        await model.findByIdAndUpdate(
            matchId,
            { $push: { set: set1 } }
        );

        return res.json({ success: true });

    } catch (error) {
        console.log(error);
        return res.json({ success: false });
    }
});


router.post('/complete-match', async (req, res) => {
    try {
        const { winnerIndex, setsWon, matchId, matchType } = req.body;

        let model;
        if (matchType === 'Boys Singles') model = singlesBoysMatches;
        if (matchType === 'Girls Singles') model = singlesGirlsMatches;
        if (matchType === 'Boys Doubles') model = doublesBoysMatches;
        if (matchType === 'Girls Doubles') model = doublesGirlsMatches;

        let gender;
        if (matchType === 'Boys Singles') gender = 'Male';
        if (matchType === 'Girls Singles') gender = 'Female';
        if (matchType === 'Boys Doubles') gender = 'Male';
        if (matchType === 'Girls Doubles') gender = 'Female';

        if (!model) return res.json({ success: false });

        // console.log('match complet info: ');
        // console.log(winnerIndex, matchId, matchType, model);
        // Get the match first
        const match = await model.findById(matchId);
        if (!match) return res.json({ success: false, message: "Match not found" });

        // console.log(match);
        let winEmail;
        // console.log(winnerIndex);
        if (winnerIndex === 0) {
            winEmail = match.email1 || match.teamt1email1; 
        } else {
            winEmail = match.email2 || match.teamt2email1;
        }

        // console.log(winEmail);
        await model.findByIdAndUpdate(
            matchId,
            {
                $set: {
                    isComplete: true,
                    winnerEmail: winEmail,
                    status: 'Complete'
                }
            },
            { new: true }
        );


        if((matchType === 'Boys Singles') || (matchType === 'Girls Singles')){


            let nextRound;
            
            const player = new registerSingles({ email: winEmail, gender: gender, isAllocated: false, round: nextRound});
            await player.save();
        }else{

        }

        

        req.session.refree.isScorecard = false;
        return res.json({ success: true });

    } catch (error) {
        console.log(error);
        return res.json({ success: false });
    }
});



module.exports = router;
