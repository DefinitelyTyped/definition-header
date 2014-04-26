export interface Header {
	label: Label;
	project: Project;
	authors: Author[];
	repository: Repository;
}

export interface Label {
	name: string;
	version: string;
}

export interface Project {
	url: string;
}

export interface Person {
	name: string;
	url: string;
}

export interface Author extends Person {

}

export interface Repository {
	url: string;
}
