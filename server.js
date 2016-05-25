var injection = require('allcountjs');
var path = require('path');
var students_json = path.join(__dirname, 'students.json');

injection.bindFactory('port', process.ENV.PORT);
injection.bindFactory('dbUrl', process.ENV.MONGODB_URI); // 'mongodb://localhost:27017/academany');
injection.bindFactory('gitRepoUrl', 'app-config');
// injection.bindFactory('gitRepoUrl', 'https://github.com/foo/bar.git');


injection.bindMultiple('viewPaths', ['myViewPathProvider']);
injection.bindFactory('myViewPathProvider', function() {
    return [path.join(__dirname, 'views')];
});


injection.bindFactory('myAppConfig', require('./api'));
injection.bindMultiple('appConfigurators', [
    'myAppConfig'
]);


var server = injection.inject('allcountServerStartup');
server.startup(function(errors) {
    if (errors) {
        throw new Error(errors);
    }
});
