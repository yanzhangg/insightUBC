interface InsightFacadeObject {
	dept: string; // the department that offered the section
	id: string; // the course number
	avg: number; // the average of the section offering
	instructor: string; // the instructor teaching the section offering
	title: string; // the name of the course,
	pass: number; // the number of students that passed the section offering
	fail: number; // the number of students that failed the section offering
	audit: number; // the number of students that audited the section offering
	uuid: string; // the unique id of a section offering
	year: number; // the year the section offering ran
}
