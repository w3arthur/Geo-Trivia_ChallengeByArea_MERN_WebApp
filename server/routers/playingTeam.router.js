const {questions} = require('../config');
const radiosPointDiameter = [ ...questions.POINTS_DIAMETER ];
const requiredQuestionsQuantity = questions.QUESTIONS_QUANTITY;

const express = require("express");
const playingTeamRouter = express.Router();

const { errorHandler } = require('../middlewares');
const { Success, MiddlewareError, ErrorHandler } = require('../classes');

const { UserModel, QuestionModel, AreaModel ,PlayingTeamModel } = require('../models');

const  sendEmail  = require('../api/sendEmail');




// player accept invitation
playingTeamRouter.route('/accept')  //  localhost:3500/api/playingTeam/acceptTeam
.patch(async (req, res, next) => {
  console.log(':: login acceptTeam router patch a player acceptance');
  errorHandler(req, res, next)( async () => {
    //link from email
      const {playingTeam : playingTeamId , player : playerId} = req.body;
      const playingTeam = await PlayingTeamModel.findById(playingTeamId);
      if(!playingTeam) throw new ErrorHandler(400, 'cant find your playing team!'); //no team
      const player = await UserModel.findById(playerId);
      if(!player) throw new ErrorHandler(400, 'cant find your player!');  //no user

      const filter = {_id: playingTeamId, "players._id": playerId};
      const data = { $set: {"players.$.accepted" : true} }  ;
      const result1 = await PlayingTeamModel.findOneAndUpdate( filter, data );
      if (!result1) throw new ErrorHandler(400, 'cant set your approvement inside playing team!');

      const result = await PlayingTeamModel.findById(playingTeamId);
      return new Success(200, result);
  });
});







//post an answer by a player
playingTeamRouter.route('/answer')  //  localhost:3500/api/playingTeam/answer
.patch(async (req, res, next) => {
  console.log(':: playing team router patch a player answer');
  errorHandler(req, res, next)( async () => {
    //link from email
    const {playingTeam: playingTeamId, player: playerId, question: questionNumber, answer: answerValue} = req.body;
    const playingTeam = await PlayingTeamModel.findById(playingTeamId);
    if(!playingTeam) throw new ErrorHandler(400, 'cant find your playing team!'); //no team
    const player = await UserModel.findById(playerId);
    if(!player) throw new ErrorHandler(400, 'cant find your user!');  //no user

    const questionId = playingTeam.questions[questionNumber]._id.toString();
    if (!questionId) throw new ErrorHandler(400, 'cant find the question for update!');
    const currentQuestion = playingTeam.currentQuestion;
    //1- check if the question exist!
    // //Boom
    // const players = playingTeam.players;
    // const currentPlayer = players.find( ({_id})=> _id ===  playerId);
    // if(currentPlayer.currentQuestion === -1 ) return 
    const filter = {_id: playingTeamId};
    const data = {$set: { "players.$[i].answers.$[j].answer": answerValue, "players.$[i].currentQuestion": currentQuestion}};
    const options = { arrayFilters: [{"i._id": playerId},{"j.question": questionId}] };
    const questionUpdate = await PlayingTeamModel.findOneAndUpdate( filter, data, options );
    if (!questionUpdate) throw new ErrorHandler(400, 'cant update the answer!');//fix for update errors

    const updatedPlayingTeam = await PlayingTeamModel.findById(playingTeamId);

    return new Success(200, updatedPlayingTeam);
  });
});



const playerAdditionalObject = (answersModel, accepted) => ({
  accepted: accepted
  , currentQuestion: -1
  , answers: answersModel
  , helpers: { h5050: true, statistic: true, follow: true }
  , boom: false
  , timeOut: false
})


// create a playingTeam & add a player to playingTeam
playingTeamRouter.route('/') 
.post( async (req, res, next) => {  //  localhost:3500/api/playingTeam/
  console.log(':: playing team router post');
  errorHandler(req, res, next)( async () => {
    const {organizer: organizerId} = req.body;
    //get organizer and players data
    const organizer = await UserModel.findById( organizerId );
    if(!organizer || organizer.length === 0) throw new ErrorHandler(400, 'cant find your player!');
    organizer.password = '';
        //get gaming language and  location
    const {language, location} = organizer; //language Updated with location inside the user (organizer!)
    if( !language ) throw new ErrorHandler(400, 'cant find your language data!');
    const {coordinates} = location;
    if(!coordinates || coordinates.length === 0) throw new ErrorHandler(400, 'cant find your coordinates data!');
    //set gaming questions by area
    const radios = radiosPointDiameter; //in KM
    const requiredQuestions = requiredQuestionsQuantity;

    //find the questions
    let i = 0;
    let areas, questions;
    const radiosArray = radiosPointDiameter;
    while(i < radiosArray.length){  //find questions for founded areas
      while(i < radiosArray.length){  //find areas for i radios
        const query = { location:{$geoWithin : { $centerSphere: [ coordinates, radiosArray[i] ] } } };
        areas = await AreaModel.find( query, {_id: 1} );    //find areas id in near radios
        if(!areas || areas.length === 0) i++;
        else break;
        }
      const areasId = []; //create array of areas id
      areas.map( x => {areasId.push( x._id )} );
      if(!areas || areasId.length === 0) throw new ErrorHandler(400, 'no areas for this radios!');
      questions = await QuestionModel.aggregate([
        { $match : { location: { $in: areasId }, language: language, approved: true } } //language added
        , { $sample: { size: requiredQuestions } } //random X questions
      ]);
      console.log(questions.length);  //to delete
      if(!questions || questions.length < requiredQuestions) i++;
      else break; //success
      }
      
      if(!questions || questions.length < requiredQuestions) throw new ErrorHandler(400, 'not enoughs question found for this erea !');

      const answersModel = [];
      questions.map( (question) => {
          const answer = { question: question._id.toString(), answer: -1}; //answer to future (patch) set it  id by player
          answersModel.push(answer)
      } );
      const organizerClone = JSON.parse(JSON.stringify( organizer ));
      const thisPlayer = {...organizerClone, ...playerAdditionalObject(answersModel, true) };

      const players = [ thisPlayer ]; //! first player
      const data = {organizer, players, questions, location, language, answersModel};
      const result = await new PlayingTeamModel( data ).save();
      if (!result) throw new ErrorHandler(400, 'cant set the playing team');
      return new Success(200, result);
  });  //error handler 
})
.patch(async (req, res, next) => {
  console.log(':: playing team router patch a player');
  errorHandler(req, res, next)( async () => {
    //find team and player
    const { playingTeamId, playerEmail} = req.body;
    const playingTeam = await PlayingTeamModel.findById(playingTeamId);
    if(!playingTeam) throw new ErrorHandler(400, 'cant find your team');
    const player = await UserModel.findOne({email: playerEmail});

    if(!player) throw new ErrorHandler(400, 'cant find the player, the email is wrong!');  //no such player
    const playerClone = JSON.parse(JSON.stringify( player ));
    playerClone.password = '';
    const thisPlayer = { ...playerClone, ...playerAdditionalObject(playingTeam.answersModel, false) }

    if(!playingTeam.players.some((x) =>  x.email?.toString() === playerEmail)){
      const playerCount = playingTeam.players.length + 1;
      const data = {$push:{players: thisPlayer}, playerCount};
      await PlayingTeamModel.findOneAndUpdate( {_id: playingTeamId} , data );
      await sendEmail(playerEmail, playingTeamId);
    }
    const result = await PlayingTeamModel.findById(playingTeamId);
    return new Success(200, result);
  });
})


//get playingTeam with all answers & delete a player from playingTeam
playingTeamRouter.route('/:playingTeamId') 
.get(async (req, res, next) => {
  console.log(':: playing team router get a player');
  errorHandler(req, res, next)( async () => {
    //get all data for app
      const {playingTeamId} = req.params;
      //1- add checker if user not connected more then X time and delete it
      //2- check if the team is from the last 20min!
      const playingTeam = await PlayingTeamModel.findById( playingTeamId );
      if (!playingTeam) throw new ErrorHandler(400, 'cant find your playing team');

      //if all the answers complete, set the boolean to true
      return new Success(200, playingTeam);
  });
})
.delete(async (req, res, next) => {
  console.log(':: playing team router delete a player');
  errorHandler(req, res, next)( async () => {
    const { playingTeamId } = req.params;
    const { playerId } = req.query;

    const playingTeam = await PlayingTeamModel.findById(playingTeamId);
    if(!playingTeam || !playerId) throw new ErrorHandler(400, 'cant find your playing team or player not set righty');
      const filter = {_id: playingTeamId, };
      const data = { $pull: {players: { _id: playerId } }   }  ;
      const player = await PlayingTeamModel.findOneAndUpdate( filter, data);
    if(!player) throw new ErrorHandler(400, 'cant set player deletion'); //to fix
    
    const result = await PlayingTeamModel.findById( playingTeamId );
    return new Success(200, result);
  });
});



//helpers update

playingTeamRouter.route('/follow')  //  localhost:3500/api/playingTeam/follow
.patch(async (req, res, next) => {
  console.log(':: playing team router patch a player follow helper');
  errorHandler(req, res, next)( async () => {
    const {playingTeam: playingTeamId, player: playerId, question: questionNumber} = req.body;
    const playingTeam = await PlayingTeamModel.findById(playingTeamId);
    if(!playingTeam) throw new ErrorHandler(400, 'cant find your playing team!'); //no team
    const player = await UserModel.findById(playerId);
    if(!player) throw new ErrorHandler(400, 'cant find your user!');  //no user //check also if player inside the playing team

    const filter0 = {_id: playingTeamId, "players._id": playerId};
    const data0 = { $set: {"players.$.helpers.follow" : false} }  ;
    const result0 = await PlayingTeamModel.findOneAndUpdate( filter0, data0 );
    if (!result0) throw new ErrorHandler(400, 'cant set your approvement inside playing team!');

    const result = await PlayingTeamModel.findById(playingTeamId);  //change to 'OK' instead rechecking
    return new Success(200, result);  //change to 'OK'
  });
});

playingTeamRouter.route('/statistic')  //  localhost:3500/api/playingTeam/statistic
.patch(async (req, res, next) => {
  console.log(':: playing team router patch a player statistic helper');
  errorHandler(req, res, next)( async () => {
    const {playingTeam: playingTeamId, player: playerId} = req.body;
    const playingTeam = await PlayingTeamModel.findById(playingTeamId);
    if(!playingTeam) throw new ErrorHandler(400, 'cant find your playing team!'); //no team
    const player = await UserModel.findById(playerId);
    if(!player) throw new ErrorHandler(400, 'cant find your user!');  //no user

    const filter0 = {_id: playingTeamId, "players._id": playerId};
    const data0 = { $set: {"players.$.helpers.statistic" : false} }  ;
    const result0 = await PlayingTeamModel.findOneAndUpdate( filter0, data0 );
    if (!result0) throw new ErrorHandler(400, 'cant set your approvement inside playing team!');

    const result = await PlayingTeamModel.findById(playingTeamId);
    return new Success(200, result);
  });
});

playingTeamRouter.route('/h5050')  //  localhost:3500/api/playingTeam/h5050
.patch(async (req, res, next) => {
  console.log(':: playing team router patch a player 50/50 helper');
  errorHandler(req, res, next)( async () => {
    const {playingTeam: playingTeamId, player: playerId, question: questionNumber} = req.body;
    const playingTeam = await PlayingTeamModel.findById(playingTeamId);
    if(!playingTeam) throw new ErrorHandler(400, 'cant find your playing team!'); //no team
    const player = await UserModel.findById(playerId);
    if(!player) throw new ErrorHandler(400, 'cant find your user!');  //no user

    const filter0 = {_id: playingTeamId, "players._id": playerId};
    const data0 = { $set: {"players.$.helpers.h5050" : false} }  ;
    const result0 = await PlayingTeamModel.findOneAndUpdate( filter0, data0 );
    if (!result0) throw new ErrorHandler(400, 'cant set your approvement inside playing team!');

    const result = await PlayingTeamModel.findById(playingTeamId);
    return new Success(200, result);
  });
});



module.exports = playingTeamRouter;
