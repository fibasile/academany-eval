var injection = require('allcountjs');
var path = require('path');
var students_json = path.join(__dirname, 'students.json');
var Crud = injection.inject('Crud');
var Console = injection.inject('Console');
var Q = injection.inject('Q');

module.exports = function(app, appAccessRouter, express) {
    return {
        configure: function() {


            appAccessRouter.get('/api/sessions', function(req, res, next) {

                var sessionsCrud = Crud.crudForEntityType('Session');
                var studentsCrud = Crud.crudForEntityType('Student');
                var sessions = [];

                sessionsCrud.find({sorting: [ {date: 1}]}).then(function(items) {
                    Console.log('Starting');
                    sessions = items;
                    return Q.all(
                        sessions.map(function(item) {
                            Console.log('Processing ' + item.id);
                            return studentsCrud.find({
                                filtering: {
                                    final_project_session: item.id
                                }
                            })
                            // .populate("lab")
                            .then(function(students) {
                                item.students = students;
                                return item;
                            });
                        })
                    );
                }).then(function(sessions) {
                    res.send(sessions);
                });
            });

            appAccessRouter.get('/api/importStudents', function(req, res, next) {
                var studentsCrud = Crud.crudForEntityType('Student');
                var labsCrud = Crud.crudForEntityType('Lab');


                var json = JSON.parse(require('fs').readFileSync(students_json, 'utf8'));
                var labs = {};
                json.forEach(function(student) {
                    if (labs[student.lab_id] == null) {
                        labs[student.lab_id] = {
                            lab_id: student.lab_id,
                            name: student.lab_name,
                            country: student.country,
                            continent: student.continent
                        };
                        labs[student.lab_id].students = [];
                    }
                    var lab_id = student.lab_id;
                    student.name = student.first;
                    student.surname = student.last;
                    delete student.first;
                    delete student.last;
                    delete student.lab_id;
                    delete student.lab_name;
                    delete student.country;
                    delete student.continent;
                    labs[lab_id].students.push(student);

                });

                Q.all(
                    Object.keys(labs).map(function(key) {

                        var lab = labs[key];

                        return labsCrud.find({
                            filtering: {
                                lab_id: lab.lab_id
                            }
                        }).then(function(items) {
                            if (items.length == 0) {
                                Console.log('Lab ' + lab.lab_id + ' not found');
                                return labsCrud.createEntity(lab).then(function(id) {
                                    lab.id = id;

                                    return lab;
                                });
                            } else {
                                Console.log('Lab ' + lab.lab_id + '  found');
                                lab.id = items[0].id;
                                return lab;
                            }
                        });
                    })

                ).then(function(items) {

                    var q = Q();
                    items.forEach(function(lab) {
                        var students = lab.students;
                        students.forEach(function(student) {
                            q = q.then(function(){
                                labsCrud.readEntity( lab.id).then(function(labObj){
                                    student.lab = labObj;
                                    student.website = 'http://archive.fabacademy.org/archives/2016/' + labObj.lab_id + '/students/' + student.student_id + '/';
                                    student.final_project_slide = student.website + 'presentation.png';
                                    student.final_project_video = student.website + 'presentation.mp4';                            
                                    Console.log(student);
                                    return studentsCrud.find({filtering: {website: student.website}}).then(function(items){
                                        if (items.length == 0)
                                            return studentsCrud.createEntity(student);
                                            
                                    });
                                });
                            });
                        
                            // student.lab = {
//                                 id: lab.id,
//                                 name: lab.name
//                             };
//                             student.lab_id = lab.lab_id;
                          
                            // promises.push( studentsCrud.createEntity(student) );
                        });
                        
                        

                    });
                    q.then(function(){
                        res.send(items);                        
                    });


                });

            });

        }
    }
};
