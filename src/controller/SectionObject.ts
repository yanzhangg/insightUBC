export default class SectionObject {

	private dept: string; // the department that offered the section
	private id: string; // the course number
	private avg: number; // the average of the section offering
	private instructor: string; // the instructor teaching the section offering
	private title: string; // the name of the course,
	private pass: number; // the number of students that passed the section offering
	private fail: number; // the number of students that failed the section offering
	private audit: number; // the number of students that audited the section offering
	private uuid: string; // the unique id of a section offering
	private year: number; // the year the section offering ran
	private datasetId: string;

	constructor(datasetId: string, dept: string, id: string, avg: number, instructor: string, title: string,
		pass: number, fail: number, audit: number, uuid: string, year: number) {
		this.datasetId = datasetId;
		this.dept = dept;
		this.id = id;
		this.avg = avg;
		this.instructor = instructor;
		this.title = title;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
		this.uuid = uuid;
		this.year = year;
	}
}
