-- MySQL dump 10.13  Distrib 9.0.1, for macos12.7 (x86_64)
--
-- Host: localhost    Database: library
-- ------------------------------------------------------
-- Server version	8.0.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `available` tinyint(1) DEFAULT '1',
  `image_url` varchar(255) DEFAULT NULL,
  `image_filename` varchar(255) DEFAULT NULL,
  `total_copies` int DEFAULT '0',
  `available_copies` int DEFAULT '0',
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,'C Is For Corpse','Sue Grafton',1,NULL,'C is for corpse.jpg',1,0,'C is for corpse.jpg'),(2,'C Is For Corpse','Sue Grafton',1,NULL,'C is for corpse.jpg',1,1,'C is for corpse.jpg'),(3,'Famous Five: Five Go Down To Treasure Island','Enid Blyton',1,NULL,'five go to treasure island.jpg',1,1,'five go to treasure island.jpg'),(4,'Famous Five: Five Go Down To Treasure Island','Enid Blyton',1,NULL,'five go to treasure island.jpg',1,1,'five go to treasure island.jpg'),(5,'Secret Seven: The Secret Seven Adventure','Enid Blyton',1,NULL,'the secret seven adventure.jpg',1,1,'the secret seven adventure.jpg'),(6,'Secret Seven: The Secret Seven Adventure','Enid Blyton',1,NULL,'the secret seven adventure.jpg',1,1,'the secret seven adventure.jpg'),(7,'Diary Of A Wimpy Kid','Jeff Kinney',1,NULL,'Diary of a wimpy kid.jpg',1,1,'Diary of a wimpy kid.jpg'),(8,'Diary Of A Wimpy Kid','Jeff Kinney',1,NULL,'Diary of a wimpy kid.jpg',1,1,'Diary of a wimpy kid.jpg'),(9,'Diary Of A Wimpy Kid: Rodrick Rules','Jeff Kinney',1,NULL,'rodrick rules.jpg',1,1,'rodrick rules.jpg'),(10,'Diary Of A Wimpy Kid: Rodrick Rules','Jeff Kinney',1,NULL,'rodrick rules.jpg',1,1,'rodrick rules.jpg'),(11,'Diary Of Wimpy Kid: Dog Days','Jeff Kinney',1,NULL,'dog days.jpg',1,1,'dog days.jpg'),(12,'Diary Of Wimpy Kid: Dog Days','Jeff Kinney',1,NULL,'dog days.jpg',1,1,'dog days.jpg');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrowed_books`
--

DROP TABLE IF EXISTS `borrowed_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrowed_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `book` varchar(255) DEFAULT NULL,
  `borrowed_date` date NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `book_id` int DEFAULT NULL,
  `borrow_count` int DEFAULT '0',
  `due_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user` (`user_id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrowed_books`
--

LOCK TABLES `borrowed_books` WRITE;
/*!40000 ALTER TABLE `borrowed_books` DISABLE KEYS */;
INSERT INTO `borrowed_books` VALUES (120,5,NULL,'2024-09-09',NULL,1,0,'2024-09-23');
/*!40000 ALTER TABLE `borrowed_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int DEFAULT NULL,
  `status` enum('available','borrowed') NOT NULL DEFAULT 'available',
  PRIMARY KEY (`id`),
  KEY `fk_book` (`book_id`),
  CONSTRAINT `fk_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (21,1,'borrowed'),(22,2,'available'),(23,3,'available'),(24,4,'available'),(25,5,'available'),(26,6,'available'),(27,7,'available'),(28,8,'available'),(31,10,'available'),(32,9,'available'),(35,11,'available'),(38,12,'available');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temp_books`
--

DROP TABLE IF EXISTS `temp_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temp_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temp_books`
--

LOCK TABLES `temp_books` WRITE;
/*!40000 ALTER TABLE `temp_books` DISABLE KEYS */;
/*!40000 ALTER TABLE `temp_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(50) DEFAULT NULL,
  `sex` varchar(10) DEFAULT NULL,
  `mobile_number` varchar(15) DEFAULT NULL,
  `country_code` varchar(5) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'vidved123','vidhyut2000@gmail.com','scrypt:32768:8:1$w1tFZyF1dCb0tNxS$1d55d405a682a494c61bd73eb8a9262132754262ec97faacb96457f8aab586ed3ab81739d3ec391d33c0a169905299744ded847bdf6411b47dee1a85d44fdbcf','Vidhyut Iyer','M','8105628374','India','user'),(4,'vidhyutiyer','vidhyutiyer2000@gmail.com','scrypt:32768:8:1$VkuqhOOQPBGwYrI2$e420e1a8db93cdfd71141437bda1cbe5d29ab8ca2427b904a26fe63d3165e5b4f8c5cd1e1c9e1a056cdf1905c00cee7c69f25fdaafa98c188214cd338f6f6302','Vidhyut Iyer','M','8105628374','India','user'),(5,'vidhyuiyer3163','vidhyut2000@outlook.com','scrypt:32768:8:1$HefLlPEKYEBfL6uV$e9084df8ed7c9a71a18ac196209b7ace5ea47e06343d6cbd7fc77fbc61390f157cbdf8cbb5bbe479a36f16af85c0779dab2d49cb51b79ac6e648acd9f0e0d877','Vidhyut Iyer','M','8105628374','India','user'),(9,'Librarian','library@gmail.com','scrypt:32768:8:1$2epbH7stW2nLqNcN$b43809a7b33161bad024dad8d4aba1c0bf80ac4aff2a64f077874f4ed9b73f0fafdeaab4b889041d5dc549700ab8b73b2ab43398bc5c598e917695befa79b662','Vidhyut Iyer','M','8105628374','India','admin'),(11,'vedanth1712','iyervedant2k05@gmail.com','pbkdf2:sha256:600000$fUUyVb451EL8I1CC$65dc8846e5c3d9de53dd482c911182a359c4b8f24abf5cfa30d22d11de767772','Vedanth Iyer',NULL,'9611521712','India','user');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-09-13 13:09:23
