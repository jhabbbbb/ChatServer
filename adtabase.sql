Create table user (
	id int Not null auto_increment primary key,
	username varchar(255),
	password varchar(255)
);

Create table message (
	id int Not null auto_increment primary key,
	sender_id int,
	reciver_id int,
	content varchar(10000),
	type varchar(255),
	status varchar(255) not null default 'wait'
);

Create table friend (
	id int Not null auto_increment primary key,
	id1 int,
	id2 int,
	username1 varchar(255),
	username2 varchar(255),
	status varchar(255) not null default 'wait'
);