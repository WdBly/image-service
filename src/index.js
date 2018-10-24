
//app icon和开屏图替换脚本
//首先从 resources目录中递归寻找 .png文件
//然后从对应的模板目录（将设计给的图按照一定结构存放的目录）中找到图 删除原图（记录数据）
//将对应设计图拷贝到 resources目录 修改格式大小文件名 
var walk = require("walk");
var fs = require("fs");
var path = require("path");
var images = require("images");


async function exists(filename) {
    return new Promise(resolve => {
        fs.exists(filename, err => {
            if(!err){
                resolve(null);
            }else{
                resolve(filename);
            }
        })
    })
}

async function unlink(filename) {
    return new Promise((resolve, reject) => {
        fs.unlink(filename, err => {
            if(err){
                console.log("delete error" + filename + err);
                reject(err);
            }else {
                resolve(filename);
            }
        })
    })
}


var main = function (arg){

    if(arg.length !== 2){
        console.log("请按照 npm run start -- source_file_absolutePath template_file_absolutePath 的格式跑脚本");
        return;
    }

    var walker = walk.walk(arg[0], { followLinks: false }),
        template_img,
        source_img,
        walker_child,
        source_img_height,
        source_img_width,
        img_path,
        relative_path,
        temp_path;        
        
    walker.on("file", async (root, fileStats, next) => {
        if(!/\.png$/.test(fileStats.name)){
            next();
        }else {
            relative_path = root.replace(arg[0],"");
            img_path = `${root}\\${fileStats.name}`;
            icon_path = "";
            splash_path = "";
            source_img = images(img_path);
            source_img_height = source_img.height();
            source_img_width = source_img.width();

            icon_path = await exists(`${arg[1]}\\icon.jpg`);
            icon_path = icon_path || await exists(`${arg[1]}\\icon.png`);

            splash_path = await exists(`${arg[1]}\\splash.jpg`);
            splash_path = splash_path || await exists(`${arg[1]}\\splash.png`);

            if(!icon_path || !splash_path){
                console.log(filename + "not exists ---error");
                return;
            }

            if(root === arg[0] && fileStats.name === "icon.png"){
                template_img = images(icon_path);
                template_img.resize(source_img_width).save(img_path);
                console.log(img_path + "---success");
                next();
            }else if(root === arg[0] && fileStats.name === "splash.png"){
                template_img = images(splash_path);
                template_img.resize(source_img_width).save(img_path, {operation:1});
                console.log(img_path + "---success");
                next();
            }else {
                //图标
                if(/icon$/.test(relative_path)){
                    template_img = images(icon_path);
                    unlink(img_path).then(() => {
                        template_img.resize(source_img_width).save(img_path, {operation:1});
                        console.log(img_path + "---success");

                        next();
                    })

                }else {

                    temp_path = await exists(`${arg[1]}${relative_path}`);
                    
                    if(!temp_path){
                        console.log(`${arg[1]}${relative_path}` + "not exists ---error");
                        return;
                    }

                    //遍历目标文件夹 找到width height 和源文件一致的图做为 template_img
                    walker_child = walk.walk(temp_path, { followLinks: false });
    
                    source_img_height = source_img.height();
                    source_img_width = source_img.width();
                    
                    walker_child.on("file", function (temp_root, temp_fileStats, temp_next) {
                        var template_img_sp = images(`${temp_root}\\${temp_fileStats.name}`);
                        
                        if(template_img_sp.height() === source_img_height && template_img_sp.width() === source_img_width){
                            fs.unlink(img_path, function(err){
                                if(err){
                                    console.log("delete error" + img_path);
                                    return;
                                }
                                
                                template_img_sp.width(source_img_width).height(source_img_height).save(img_path);
                                console.log(img_path + "---success");
                                
                                next();
                            });
                        }

                        temp_next();
                    });
                }
            }
        }
    });

    walker.on("errors", function (root, nodeStatsArray, next) {
        console.log(root, nodeStatsArray);
    });

    walker.on("end", function () {
        console.log("all done");
    });
};


main(process.argv.splice(2));
