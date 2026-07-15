CREATE TABLE `balance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` varchar(7) NOT NULL,
	`totalIncome` decimal(12,2) DEFAULT '0',
	`totalExpense` decimal(12,2) DEFAULT '0',
	`pixBalance` decimal(12,2) DEFAULT '0',
	`budgetLimit` decimal(12,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `balance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50) DEFAULT '•',
	`color` varchar(7) DEFAULT '#6366f1',
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`brand` varchar(50) DEFAULT 'Outros',
	`limitTotal` decimal(12,2) NOT NULL,
	`limitUsed` decimal(12,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creditCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurringTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`paymentMethod` enum('pix','creditCard') DEFAULT 'pix',
	`creditCardId` int,
	`categoryId` int,
	`person` enum('Igor','Giovana') NOT NULL,
	`dayOfMonth` int DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`lastApplied` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`date` varchar(10) NOT NULL,
	`month` varchar(7) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`paymentMethod` enum('pix','creditCard') DEFAULT 'pix',
	`creditCardId` int,
	`categoryId` int,
	`person` enum('Igor','Giovana') NOT NULL,
	`isFixed` boolean DEFAULT false,
	`recurringId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
