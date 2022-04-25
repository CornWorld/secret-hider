#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";


let program=new Command();

program
    .name("secretHider")
    .version("1.0.0")
;

program
    .command("parse")
    .argument("<string>","path to a single file or a single dir")
    .option("-c,--config <string>","path to config file(default './secret-hider.config.json')")
    .action((arg,options)=>{
        let path=arg;
        let config={};
        try {
            config=JSON.parse(fs.readFileSync(options.config??"./secret-hider.config.json").toString());
        }
        catch (err) {
            console.error(err);
        }
        try {
            if(fs.existsSync(path)) {
                let fileList=searchFiles(path,config.rules);
                for(let path of fileList) {
                    fs.readFile(path, (err,data)=>{
                        if(err===null) {
                            let str=data.toString("utf8");
                            if(Buffer.compare(Buffer.from(str,"utf8") , data) === 0) {
                                if(config.hasOwnProperty("replace")) {
                                    for(let item in config) {
                                        str=str.replaceAll("[[["+item+"]]]",config[item]);
                                    }
                                }
                                fs.writeFileSync(path, str);
                            }
                        }
                    });
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    })
;

program.parse();

/**
 * @param path string
 * @param rules string
 * @return Array all files following the rules in a path
 * */
function searchFiles(path, rules) {
    let fileList=[];
    try {
        let pathStat=fs.statSync(path);
        if(pathStat.isDirectory()) {
            if(path.slice(-1)!=='/') path+='/';
            let allFileList=fs.readdirSync(path);
            for(let name of allFileList) {
                fileList=fileList.concat(searchFiles(path+name, rules));
            }
        }
        else if(pathStat.isFile() && path.search(rules)) {
            fileList.push(path);
        }
    }
    catch (err) {
        console.warn(err);
    }
    return fileList;
}