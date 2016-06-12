A.app({
    appName: 'Fab Academy - Final Project Management',
    appIcon: 'globe',
    allowSignUp: false,
    onlyAuthenticated: true,
    roles: ['instruct', 'eval'],
    menuItems: [{
        name: 'Students',
        icon: 'users',
        entityTypeId: 'Student',
    }, {
        name: 'Labs',
        icon: 'book',
        entityTypeId: 'Lab'
    }, {
        name: 'Final Projects',
        icon: 'final',
        children: [{
            name: 'Sessions',
            icon: 'table',
            entityTypeId: 'Session'
        }, {
            name: 'Schedule',
            icon: 'table',
            entityTypeId: 'FinalProjectSchedule'
        }, {
            name: 'Presented',
            icon: 'table',
            entityTypeId: 'FinalProjectPresented'
        }, {
            name: 'Missing',
            icon: 'table',
            entityTypeId: 'MissingFinalProject'
        }]
    }],
    entities: function(Fields) {
        return {
            User: {
                
            },
            Student: {
                title: 'Students',
                referenceName: 'fullname',
                permissions: {
                    read: null,
                    write: ['instruct','eval'],
                    delete: []  
                },
                fields: {
                    student_id: Fields.text('Student ID').required(),
                    fullname: Fields.text('Full name').readOnly(),
                    name: Fields.text('Name').required(),
                    surname: Fields.text('Surname').required(),
                    email: Fields.email('Email').required(),
                    website: Fields.link('Website'),
                    notes: Fields.textarea('Notes'),
                    graduated: Fields.checkbox('Graduated').readOnly(),
                    completed: Fields.checkbox('Completed').readOnly(),
                    needs_eval: Fields.checkbox('Needs Re-evaluation').readOnly(),
                    lab: Fields.fixedReference('Lab', 'Lab'),
                    final_project_session: Fields.fixedReference("Project presentation", "Session"),
                    final_project_presented: Fields.checkbox('Project presented'),
                    final_project_slide: Fields.link('Project Slide URL'),
                    final_project_video: Fields.link('Project Video URL')

                },
                actions: [{
                    id: 'reload',
                    name: 'Reload',
                    actionTarget: 'single-item',
                    perform: function(Crud, Actions, Console, Q, Pipes) {
                        var crud = Crud.actionContextCrud();
                        return crud.readEntity(Actions.selectedEntityId()).then(function(provider) {
                            return Actions.refreshResult();
                        });
                    }
                }, {
                    id: 'graduate',
                    name: 'Graduate',
                    actionTarget: 'single-item',
                    perform: function(Crud, Actions) {
                        var crud = Crud.actionContextCrud();
                        return crud.readEntity(Actions.selectedEntityId()).then(function(entity) {
                            entity.graduated = true;
                            entity.completed = true;
                            entity.needs_eval = false;
                            return crud.updateEntity(entity);
                        }).then(function() {
                            return Actions.refreshResult();
                        });
                    }
                },  {
                    id: 'complete',
                    name: 'Mark complete',
                    actionTarget: 'single-item',
                    perform: function(Crud, Actions) {
                        var crud = Crud.actionContextCrud();
                        return crud.readEntity(Actions.selectedEntityId()).then(function(entity) {
                            entity.completed = true;
                            entity.graduated = false;
                            entity.needs_eval = false;
                            return crud.updateEntity(entity);
                        }).then(function() {
                            return Actions.refreshResult();
                        });
                    }
                },  {
                    id: 'needseval',
                    name: 'Need Re-Eval',
                    actionTarget: 'single-item',
                    perform: function(Crud, Actions) {
                        var crud = Crud.actionContextCrud();
                        return crud.readEntity(Actions.selectedEntityId()).then(function(entity) {
                            entity.graduated = false;
                            entity.completed = false;
                            entity.needs_eval = true;
                            return crud.updateEntity(entity);
                        }).then(function() {
                            return Actions.refreshResult();
                        });
                    }
                }],
                showInGrid: ['student_id', 'name', 'surname', 'email', 'lab'],
                sorting: [
                    ['student_id', 1],
                    ['surname', 1],
                    ['name', 1]
                ],
                beforeSave: function(Entity, Crud, ValidationError) {
                    Entity.fullname = Entity.name + ' ' + Entity.surname;
                    var crud = Crud.crudFor('Student');
                    var crud2 = Crud.crudFor('Session');

                    if (Entity.final_project_session) {

                        return crud2.readEntity(Entity.final_project_session.id).then(function(session) {

                            var filteringDict = {
                                final_project_session: session.id
                            };

                            return crud.find({
                                filtering: filteringDict
                            }).then(function(items) {
                                var incr = 1;
                                for (var i = 0; i < items.length; i++) {
                                    if (items[i].id == Entity.id) {
                                        incr = 0;
                                    }
                                }
                                if (items.length + incr <= session.max_students) {

                                    return crud2.updateEntity({
                                        id: session.id,
                                        students_count: items.length + incr
                                    });
                                } else {
                                    throw new ValidationError({
                                        final_project_session: 'The maximum number of students for this session has been reached.'
                                    });
                                }

                            });

                        });
                    }
                },
                afterSave: function(Entity, Crud,Q) {
                    return updateSessionCounts(Crud,Q);
                },
                views: {
                    FinalProjectSchedule: {
                        title: 'Final Project Schedule',
                        filtering: 'final_project_session != null',
                        showInGrid: ['final_project_session', 'lab', 'student_id', 'name', 'surname', 'final_project_presented'],
                        sorting: [
                            ['final_project_session', 1],
                            ['lab', 1]
                        ]
                    },
                    FinalProjectPresented: {
                        title: 'Final Project Presented',
                        filtering: 'final_project_presented = true',
                    },
                    MissingFinalProject: {
                        title: 'Missing Final Project',
                        filtering: {
                            "final_project_session" : {
                                "$type": 10
                            },
                            "final_project_session" : {
                                "$exists": false
                            }
                        },
                        sorting: [["surname", 1], ["name", 1]]
                    },
                    StudentsForLab: {
                        title: 'Enrolled Students',
                        showInGrid: ['student_id', 'name', 'surname', 'final_project_session', 'final_project_presented']
                    },
                    StudentsForSession: {
                        showInGrid: ['lab', 'student_id', 'name', 'surname', 'final_project_presented']
                    },
                    StudentsForSessionPresented: {
                        showInGrid: ['lab', 'student_id', 'name', 'surname', 'final_project_presented'],
                        filtering: 'final_project_presented = true'
                    }

                }
            },
            Session: {
                title: 'Session',
                referenceName: 'session',
                permissions: {
                    read: null,
                    write: ['instruct','eval'],
                    delete: ['eval']  
                },
                fields: {
                    name: Fields.text('Name'),
                    date: Fields.date('Date'),
                    session: Fields.text('Session name').readOnly(),
                    max_students: Fields.integer('Max students').required(),
                    students_count: Fields.integer('Registered Count').readOnly(),
                    students: Fields.relation('Registered Students', 'StudentsForSession', 'final_project_session'),
                    presented_students: Fields.relation('Students who Presented', 'StudentsForSessionPresented', 'final_project_session')
                },
                views: {
                    SessionSchedule: {
                        customView: "session"
                    }
                },
                beforeSave: function(Entity, Crud) {

                    Entity.session = Entity.name;
                    var crud = Crud.crudFor('Student');
                    return crud.find({
                        filtering: {
                            final_project_session: Entity.id
                        }
                    }).then(function(items) {
                        Entity.students_count = items.length;
                    });
                }
            },
            Lab: {
                title: 'Lab',
                referenceName: 'name',
                permissions: {
                    read: null,
                    write: ['instruct','eval'],
                    delete: []  
                },
                fields: {
                    lab_id: Fields.text('Lab ID'),
                    name: Fields.text('Name'),
                    country: Fields.text('Country'),
                    continent: Fields.text('Continent'),
                    students: Fields.relation('Registered Students', 'StudentsForLab', 'lab')
                },
                sorting: [
                    ['continent', 1],
                    ['country', 1],
                    ['name', 1]
                ],
            }
        }
    }
});

function updateSessionCounts(Crud,Q) {
    var crud = Crud.crudFor('Session');

    return crud.find({}).then(function(items) {
        return Q.all(
            items.map(function(session) {
           
                return Crud.crudFor('Student').find({
                    filtering: {
                        final_project_session: session.id
                    }
                }).then(function(students) {
                    return crud.updateEntity({
                        id: session.id,
                        students_count: students.length
                    });
                });

            })

        );
    });
}
