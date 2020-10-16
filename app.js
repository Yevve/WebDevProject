const express = require('express')
const expressHandlebars = require('express-handlebars')
const bodyParser=require('body-parser')
const sqlite3=require('sqlite3')
const expressSession=require('express-session')
const SQLiteStore=require('connect-session-knex')(expressSession)
const bcrypt=require('bcryptjs')
const { query } = require('express')



const db = new sqlite3.Database("website-database.db")
const app = express()

const saltRounds=10

db.run(`
CREATE TABLE IF NOT EXISTS comments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bpId INTEGER,
    comment TEXT
)


`)
db.run(`
CREATE TABLE IF NOT EXISTS user(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT,
    hashPassword TEXT
)


`)
db.run(`
CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    blogpost TEXT
)
`)

db.run(`
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    randomId TEXT
)
`)

app.engine(".hbs",expressHandlebars({
    defaultLayout:"main.hbs"
}))
app.use(expressSession({
    secret:"asdfasdf",
    saveUninitialized:false,
    resave:false,
    store:new SQLiteStore({
        
    })

}))
app.use(express.static("static"))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.get("/layout.css")

app.use(function(request,response,next){
    const isLoggedIn=request.session.isLoggedIn
    response.locals.isLoggedIn=isLoggedIn
    next()

})

app.get("/",function(request,response){
response.render("start.hbs")
})

app.get("/about",function(request,response){
    response.render("about.hbs")
})

app.get("/contact",function(request,response){
    response.render("contact.hbs")
})
function getValErrorFromMessage(message){
    const validationError=[]
    if(message.message ==0){
        validationError.push("Message window can not be empty")
    }
    return validationError
}
app.post("/contact",function(request,response){
    const message = request.body.message
    const randomId=makeid(10)
    const validationErrors= getValErrorFromMessage(message)
    if(validationErrors.length==0){
        const query="INSERT INTO messages (message,randomId) VALUES(?,?)"
    const values= [message,randomId]

    db.run(query,values,function(error){
        if(error){
            console.log(error)
        }else{

            response.redirect("/messages/"+randomId)
        }
    })
    }else{
        const model={
            validationErrors,
            message
        }
        response.render("contact.hbs",model)
    }
})
app.get("/messages",function(request,response){
    const query ="SELECT * FROM messages ORDER BY id"

    db.all(query,function(error,message){
        if(error){
            console.log(error)

        }else{
    const model={
        message 
    }

    response.render("messages.hbs",model)
    }
    })


})
app.get("/messages/:randomId",function(request,response){
    const id = request.params.randomId

    const query ="SELECT * FROM messages WHERE randomId =?"
    const values=[id]
    db.get(query,values,function(error,message){
        if(error){
            console.log(error)
            const model={
                dbError:true
            }
            response.render("message.hbs",model) 
        }else{
           const model={
        message,
        dbError:false
    }

    response.render("message.hbs",model) 
        }
        
    }) 

})

app.get("/update-message/:randomId",function(request,response){
    const id= request.params.randomId
    const query ="SELECT * FROM messages WHERE randomId=?"
    const values =[id]
    db.get(query,values,function(error,message){
        if(error){
            console.log(error)
        }else{
            const model={
                message
            }
            response.render("update-message.hbs",model)
        }
    })
    
})
app.post("/update-message/:randomId",function(request,response){
    const id = request.params.randomId
    const newMessage=request.body.message
    const validationErrors= getValErrorFromMessage(newMessage)
    if(validationErrors==0){
        const query=`
        UPDATE
            messages
        SET
            message=?
        WHERE
            randomId=?`
        const values =[newMessage,id]
        db.run(query,values,function(error){
            if(error){
                console.log(error)
            }else{
                response.redirect("/messages/"+id)
            }
        })
    }else{
        const model={
            message:{
                id,
                message:newMessage
            },
            validationErrors
        }
        response.render("update-message.hbs",model)
    }
    
})
app.post("/delete-message/:randomId",function(request,response){
    const id = request.params.randomId
    const query="DELETE FROM messages WHERE randomId=?"
    const values=[id]
    db.run(query,values,function(error){
        if(error){
            console.log(error)
        }else{
           response.redirect("/") 
        }
    })
        
})
app.post("/comment/:id",function(request,response){
    const id = request.params.id
    const comment= request.body.comment
    const query="INSERT INTO comments (bpId,comment) VALUES(?,?)"
    const values=[id,comment]
    
    db.run(query,values,function(error){
        if(error){
            console.log(error)
        }else{

            response.redirect("/blogs/"+id)
        }
    })
})


app.get("/blogs",function(request,response){
    const query ="SELECT * FROM blogs ORDER BY id"

    db.all(query,function(error,blogs){
        if(error){
            console.log(error)

        }else{
    const model={
        blogs 
    }

    response.render("blogs.hbs",model)
    }
    })

    

})

function getValErrorFromBlog(title,blogpost){

    const validationErrors=[]
    if(title.length == 0){
        validationErrors.push("Title can't be empty ")
    }
    if(blogpost.length ==0){
        validationErrors.push("Blogpost can't be empty")
    }

    return validationErrors
}
app.get("/update-blog/:id",function(request,response){
    const id= request.params.id
    const query ="SELECT * FROM blogs WHERE id=?"
    const values =[id]
    db.get(query,values,function(error,blog){
        if(error){
            console.log(error)
        }else{
            const model={
                blog
            }
            response.render("update-blog.hbs",model)
        }
    })
    
})
app.post("/update-blog/:id",function(request,response){
    const id = request.params.id
    const newTitle=request.body.title
    const newBlogpost=request.body.blogpost
    const validationErrors= getValErrorFromBlog(newTitle,newBlogpost)
    if(validationErrors==0){
        const query=`
        UPDATE
            blogs
        SET
            title=?,
            blogpost=?
        WHERE
            id=?`
        const values =[newTitle,newBlogpost,id]
        db.run(query,values,function(error){
            if(error){
                console.log(error)
            }else{
                response.redirect("/blogs/"+id)
            }
        })
    }else{
        const model={
            blog:{
                id,
                title:newTitle,
                blogpost: newBlogpost
            },
            validationErrors
        }
        response.render("update-blog.hbs",model)
    }
    
})
app.post("/delete-blog/:id",function(request,response){
    const id = request.params.id
    const query="DELETE FROM blogs WHERE id=?"
    const values=[id]
    db.run(query,values,function(error){
        if(error){
            console.log(error)
        }else{
           response.redirect("/blogs") 
        }
    })
        
})
app.get("/blogs/:id",function(request,response){
    const id = request.params.id

    const query ="SELECT * FROM blogs WHERE id =?"
    const values=[id]
    db.get(query,values,function(error,blog){
        if(error){
            console.log(error)
            const model={
                dbError:true
            }
            response.render("blog.hbs",model) 
        }else{
           const model={
        blog,
        dbError:false
    }

    response.render("blog.hbs",model) 
        }
        
    }) 

})
app.get("/create-blogpost",function(request,response){
    if(request.session.isLoggedIn){
       response.render("create-blogpost.hbs") 
    }else{
        response.redirect("/login")
    }
    
})

app.post("/create-blogpost",function(request,response){
    const title = request.body.title
    const blogpost = request.body.blogpost
    const validationErrors= getValErrorFromBlog(title,blogpost)
    if(!request.session.isLoggedIn){
        validationErrors.push("You must log in to post new blogs")
    }
    if(validationErrors.length==0){
        const query="INSERT INTO blogs (title,blogpost) VALUES(?,?)"
    const values= [title,blogpost]

    db.run(query,values,function(error){
        if(error){
            console.log(error)
        }else{

            response.redirect("/blogs/"+this.lastID)
        }
    })
    }else{
        const model={
            validationErrors,
            title,
            blogpost
        }
        response.render("create-blogpost.hbs",model)
    }
})

app.get("/login",function(request,response){
    response.render("login.hbs")
})
app.post("/login",function(request,response){
    const enteredUsername=request.body.username
    const enteredPassword=request.body.password
    const query="SELECT * FROM user WHERE userName=?"
    const values=[enteredUsername]
    db.all(query,values,function(error,user){
        if(error){
            console.log(error) 
        }else{
            if(user.length){
         if(enteredUsername==user[0].userName && bcrypt.compareSync(enteredPassword, user[0].hashPassword)){
        request.session.isLoggedIn=true
        response.redirect("/")
    }else{
        //error message
        response.redirect("/blogs")
    } 
      }else{
          response.redirect("/")
      }
        }   
    })
    
})

app.post("/logout",function(request,response){
    request.session.isLoggedIn=false
    response.redirect("/")
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

app.listen(3000)

