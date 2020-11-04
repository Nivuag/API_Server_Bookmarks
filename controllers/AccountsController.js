const Repository = require('../models/Repository');
const TokenManager = require('../tokenManager');
const utilities = require("../utilities");
const User = require('../models/user');

module.exports = 
class AccountsController extends require('./Controller') {
    constructor(req, res){
        super(req, res);
        this.usersRepository = new Repository('Users');
    }

    // list of users with masked password
    index(id) {
        if(!isNaN(id)) {
            let user =  this.usersRepository.get(id);
            if (user != null) {
                let userClone = {...user};
                userClone.Password = "********";
                this.response.JSON(userClone);
            }
        }
        else {
            let users = this.usersRepository.getAll();
            let usersClone = users.map(user => ({...user}));
            for(let user of usersClone) {
                user.Password = "********";
            }
            this.response.JSON(usersClone);
        }
    }

    // POST: /token body payload[{"Email": "...", "Password": "...", "grant-type":"password"}]
    login(loginInfo) {
        // to do assure that grant-type is present in the request header
        let user =  this.usersRepository.findByField("Email", loginInfo.Email);
        if (user != null){
            if (user.Password == loginInfo.Password) {
                let newToken = TokenManager.create(user.Email);
                let userNameToken = user.Name;
                let EmailToken = user.Email;
                let IdToken = user.Id;
                console.log(newToken)
                this.response.JSON([newToken,userNameToken,EmailToken,IdToken]);
            } else
                this.response.badRequest();
        } else
            this.response.badRequest();
    }
    
    // POST: account/register body payload[{"Id": 0, "Name": "...", "Email": "...", "Password": "..."}]
    register(user) {  
        user.Created = utilities.nowInSeconds();
        // validate User before insertion
        if (User.valid(user)) {
            // avoid duplicates Email
            if (this.usersRepository.findByField('Email', user.Email) == null) {
                // take a clone of the newly inserted user
                let newUser = {...this.usersRepository.add(user)};
                if (newUser) {
                    // mask password in the json object response
                    newUser.Password = "********";
                    this.response.created(newUser);
                } else
                    this.response.internalError();
            } else
                this.response.conflict();
        } else
            this.response.unprocessable();
    }
   // TODO : Retourner l'objet dans response correctement
   // Tester Remove
    // PUT: account/change body payload[{"Id": 0, "Name": "...", "Email": "...", "Password": "..."}]
    change(user) {
        if (this.requestActionAuthorized()){
            console.log(user);
                let didItWork = this.usersRepository.update(user);
                if (didItWork) {
                    user.Password = "********";
                    this.response.updated({...user});
                } else
                    this.response.internalError();

                }
        else
        this.response.unAuthorized();
    }
    // todo
    // Effacer tout les bookmarks liés à se compte
    // DELETE: account/remove/id 
    remove(id) {
        if (this.requestActionAuthorized()){
            if(this.usersRepository.remove(id))
            this.response.ok();
            else
            this.response.internalError();
        }else
        this.response.unAuthorized();
    }
}