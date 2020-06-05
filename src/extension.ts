import * as vscode from 'vscode';
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const getProblemNo = (value: any) => {
	var parts = value.split(' ');
	return {
		contest: parts[0],
		no: parts[1].toUpperCase()
	};
};

const createFolderIfNotExists = (folderPath: any) => {
	if(!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	} else {
		console.log('Folder already exists');
	}
};

const createFileIfNotExists = (filePath: any, content = '') => {
	if(!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, content);
	} else {
		console.log('File already exists');
	}
};

const handlePage = (problem: any, response: any) => {
	const $ = cheerio.load(response.data);
	const title = $('.problem-statement .header .title').text().split(".")[1].trim();
	const folderName = `${problem.contest}${problem.no}-${title}`;

	console.log(title);
	console.log(folderName);
	
	const folderPath = path.join((vscode.workspace.workspaceFolders||[])[0].uri.fsPath, folderName);
	console.log(folderPath);
	createFolderIfNotExists(folderPath);
	const mainFilePath = path.join(folderPath, 'Main.java');
	createFileIfNotExists(mainFilePath, `import java.util.*;

public class Main {
	static Scanner in;
	public static void main(String[] args) {
		in = new Scanner(System.in);

		in.close();
	}
}
`);
	return vscode.workspace.openTextDocument(mainFilePath).then((doc) => {
		vscode.window.showTextDocument(doc);
		console.log('Main.java opened');
	});
};

export function activate(context: vscode.ExtensionContext) {

	console.log('CodeForces plugin for the Problem Set');

	let disposable = vscode.commands.registerCommand('cf-helper.downloadProblem', () => {
		const folders = (vscode.workspace.workspaceFolders || []);
		vscode.window.showInformationMessage(`CodeForces helper plugin. Folders ${folders.length}`);

		if(folders.length == 0) {
			vscode.window.showInformationMessage("Please open a folder to create the problem folder");
			return;
		}

		return vscode.window.showInputBox({
			prompt: 'Please enter problem no? e.g. 117 a'
		}).then((value) => {
			const problem = getProblemNo(value);
			console.log(problem);
			// vscode.window.showInformationMessage(`Value entered: ${JSON.stringify(getProblemNo(value))}`);
			const url = `https://codeforces.com/problemset/problem/${problem.contest}/${problem.no}`;
			return axios.get(url).then((res: any) => {
				return handlePage(problem, res);
			});
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
