const express = require('express')
const expressHandlebars = require('express-handlebars')
const bodyParser=require('body-parser')
const sqlite3=require('sqlite3')
const expressSession=require('express-session')
const SQLiteStore=require('connect-sqlite3')(expressSession)
const { query } = require('express')
const session = require('express-session')


const db = new sqlite3.Database("website-database.db")
const app = express()

db.run(`
CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    blogpost TEXT
)
`)
const trueUsername="admin"
const truePassword="admin123"

app.engine(".hbs",expressHandlebars({
    defaultLayout:"main.hbs"
}))
app.use(expressSession({
    secret:"asdfasdf",
    saveUninitialized:false,
    resave:false,
    store: new SQLiteStore

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
    if(enteredUsername==trueUsername && enteredPassword==truePassword){
        request.session.isLoggedIn=true
        response.redirect("/")
    }else{
        //error msg
        response.redirect("/blogs")
    }
})

app.post("/logout",function(request,response){
    request.session.isLoggedIn=false
    response.redirect("/")
})

app.listen(8080)

