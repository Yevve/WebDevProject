const express = require('express')
const expressHandlebars = require('express-handlebars')
const bodyParser=require('body-parser')
const app = express()

const blogs=[{
    id:1,
    title:"First Post",
    blogpost: "Here is the first blogpost I made"

}]

app.engine(".hbs",expressHandlebars({
    defaultLayout:"main.hbs"
}))

app.use(express.static("static"))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.get("/layout.css")

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
    
    const model={
        blogs 
    }

    response.render("blogs.hbs",model)

})

app.post("/delete-blog/:id",function(request,response){
    const id = request.params.id
    const blogIndex = blogs.findIndex(
        b => b.id==id
        )
        blogs.splice(blogIndex,1)
        response.redirect("/blogs")
})
app.get("/blogs/:id",function(request,response){
    const id = request.params.id

    const blog = blogs.find(
        b => b.id == id
    )
    const model={
        blog
    }

    response.render("blog.hbs",model)

})
app.get("/create-blogpost",function(request,response){
    response.render("create-blogpost.hbs")
})
app.post("/create-blogpost",function(request,response){
    const title = request.body.title
    const blogpost = request.body.blogpost
    const blog={
        title,
        blogpost,
        id:blogs.length +1
    }
    blogs.push(blog)
    response.redirect("/blogs/"+blog.id)
})

app.listen(8080)

