// Entity class related to users
class UserModel {

    constructor( id = null, name, email, status, role ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.status = status;
        this.role = role;
    }
}

module.exports = UserModel;