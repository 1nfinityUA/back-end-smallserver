const {Schema, model} = require('mongoose');


const User = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    roles: {type: String, default: 'user'},
    subordinate: [{type: String, default: ''}],
    boss: {type: String, required: true}
})

module.exports = model('User', User)

// шаблон для створення ного юзера
// обов"язкове поле БОСС так треба по завданню
// вказати босса можливо тільки одного і тільки існуючого в БД