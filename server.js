var injection = require('allcountjs');
var path = require('path');

injection.bindFactory('port', 9080);
injection.bindFactory('dbUrl', 'mongodb://localhost:27017/academany');
injection.bindFactory('gitRepoUrl','app-config');
// injection.bindFactory('gitRepoUrl', 'https://github.com/foo/bar.git');

injection.bindMultiple('viewPaths', ['myViewPathProvider']);
injection.bindFactory('myViewPathProvider', function () {
    return [path.join(__dirname, 'views')];
});


var server = injection.inject('allcountServerStartup');
server.startup(function (errors) {
    if (errors) {
        throw new Error(errors.join('\n'));
    }
});