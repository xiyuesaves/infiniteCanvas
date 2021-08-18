const db = require('better-sqlite3')('canvas.db');
const db1 = require('better-sqlite3')('main.db');
var path = require("path");
var fs = require("fs");

var pathName = "./path";
var dirs = [];
db.prepare("DELETE FROM path WHERE canvas_id = 0;").run()
let dataArr = db1.prepare("SELECT pathFile FROM path_list WHERE disable = ?").all(1)
let b = []
for (var i = 0; i < dataArr.length; i++) {
    b.push(dataArr[i].pathFile)
}
fs.readdir(pathName, function(err, files) {
    files.sort(function(a, b) {
        return a.split("-")[2] - b.split("-")[2];
    });
    for (var i = 0; i < files.length; i++) {
        if (b.indexOf(files[i]) === -1) {
            var data = fs.readFileSync(`./path/${files[i]}`).toString().replace(/,"tween":false/g, "")
            var canvas_id = files[i].split("-")[0]
            var user_id = files[i].split("-")[1]
            db.prepare("INSERT INTO path (canvas_id,user_id,path_data) VALUES (?,?,?)").run(canvas_id, user_id, data)
        }
    }
});