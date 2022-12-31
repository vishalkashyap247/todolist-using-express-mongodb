const express = require('express');
const app = express();
require("dotenv").config();

const port = process.env.PORT || 3000;
var _ = require('lodash');

//mongoose connect
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);//to remove warning
// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

mongoose.connect(process.env.mongodb_uri+"/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String
});
//default item
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
    name:"welcome to my todolist"
});

const item2 = new Item({
    name:"use + button to add new list"
});

const item3 = new Item({
    name:"<<< use this checkbox to delete an list"
});

const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    item: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.use(express.urlencoded({extended: true}));//body-parseer
app.use(express.static("public"));

//exploring export in JS
const numo = require(__dirname+"/sec.js");
// console.log(numo.num());

// console.log(numo);
// console.log(numo("vishal"));

//ejs required for view folder
app.set('view engine','ejs');

app.get('/', function(req, res)
{
    Item.find(function(err, items)
    {
        if(err){
            console.log(err);
        }
        else
        {
            if(items.length == 0){
                Item.insertMany( defaultItem ,function(err){
                if(err){
                    console.log(err);
                }
                else{
                    // console.log("all 3 items is inerted into monogoDB");
                 }
                });
                res.redirect('/');
            }
            else{
                res.render('index',{listTitle : "Today", listt : items});
            }
        }
    });
});

app.get('/about', (req, res)=>
{
    res.render('about');
});

app.get("/:newRoute",(req,res)=>{
    // console.log(req.params.newRoute);
    const customListName = _.lowerCase(req.params.newRoute);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                // console.log("Doesn't exist so ");
                const list = new List({
                    name: customListName,
                    item: defaultItem
                });
                list.save().then(()=>{res.redirect('/'+ customListName );}).catch(err => res.status(501).send("User- query promise was rejected. Handle according to specific case."));
            }
            else
            {
                // console.log("exists");//show existing list
                res.render('index',{listTitle : foundList.name, listt : foundList.item});
            }
        }
    });
});

app.post("/", function(req, res)
{
    const item = req.body.newInput;
    const listName = req.body.button;
    
    const newItem = new Item({
        name: item
    });

    if(listName === "Today"){
        newItem.save().then(()=>{res.redirect('/')}).catch(err => res.status(501).send("User- query promise was rejected. Handle according to specific case."));
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.item.push(newItem);
            foundList.save().then(()=>{res.redirect('/'+listName);}).catch(err => res.status(501).send("User- query promise was rejected. Handle according to specific case."));
            // console.log("ok we have found "+ foundList);
        });
    }
});

app.post('/delete',function(req, res){
    // console.log(req.body.checkbox);
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.deleteOne({_id: checkedItemId}).then(res.redirect('/'));
    }
    else{
        List.updateOne({name: listName},{$pull: {item: {_id: checkedItemId}}}, function(err){
            if(err){
                console.log(err);
            }
            else{
                res.redirect("/"+listName);
            }
        });
    }
});

app.listen(port, function()
{
    console.log(`server is running at http://localhost:${port}`);
});
