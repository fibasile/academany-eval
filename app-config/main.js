A.app({
    appName: 'Final Project Management',
    appIcon: 'globe',
    allowSignUp: true,
    onlyAuthenticated: false,
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
        },
            {
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
        }
        ]
    }],
    entities: function(Fields) {
        return {            
            Student: {
                title: 'Students',
                referenceName: 'fullname',
                fields: {
                    student_id: Fields.text('Student ID').required(),
                    fullname: Fields.text('Full name').readOnly(),
                    name: Fields.text('Name').required(),
                    surname: Fields.text('Surname').required(),
                    email: Fields.email('Email').required(),
                    website: Fields.link('Website'),
                    notes: Fields.textarea('Notes'),
                    lab: Fields.fixedReference('Lab','Lab'),
                    final_project_session: Fields.fixedReference("Project presentation", "Session"),
                    final_project_presented: Fields.checkbox('Project presented')
                },
                showInGrid: ['student_id', 'name', 'surname', 'email','lab'],
                sorting: [
                    ['surname', 1],
                    ['name', 1]
                ],
                beforeSave: function(Entity) {
                    Entity.fullname = Entity.name + ' ' + Entity.surname;
                },
                views: {
                    FinalProjectSchedule: {
                        title: 'Final Project Schedule',
                        filtering: 'final_project_session != null',
                        showInGrid: ['final_project_session', 'lab', 'student_id', 'name', 'surname', 'final_project_presented'],
                        sorting: [['final_project_session',1], ['lab',1]]
                    },
                    FinalProjectPresented: {
                        title: 'Final Project Presented',
                        filtering: 'final_project_presented = true',
                    },
                    MissingFinalProject: {
                        title: 'Missing Final Project',
                        filtering: 'final_project_session = null'                        
                    },
                    StudentsForSession: {
                        showInGrid: ['lab','student_id', 'name', 'surname','final_project_presented']
                    },
                    StudentsForSessionPresented: {
                        showInGrid: ['lab','student_id', 'name', 'surname','final_project_presented'],
                        filtering: 'final_project_presented = true'
                    }
                    
                }
            },
            Session: {
                title: 'Session',
                referenceName: 'session',
                fields: {
                    name: Fields.text('Name'),
                    date: Fields.date('Date'),
                    session: Fields.text('Session name').readOnly(),
                    students: Fields.relation('Registered Students', 'StudentsForSession', 'final_project_session'),
                    presented_students: Fields.relation('Students who Presented', 'StudentsForSessionPresented', 'final_project_session')
                    
                },
                beforeSave: function(Entity) {
                    Entity.session = Entity.name + ' ' + Entity.date;
                },
            },
            Lab: {
                title: 'Lab',
                referenceName: 'name',
                fields: {
                    lab_id: Fields.text('Lab ID'),
                    name: Fields.text('Name'),
                    country: Fields.text('Country'),
                    continent: Fields.text('Continent')
                }
            }
        }
    }
});
