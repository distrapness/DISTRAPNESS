-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: localhost    Database: online_shop
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `total` decimal(15,2) NOT NULL,
  `paymentMethod` varchar(50) NOT NULL,
  `status` enum('pending','waiting_payment','waiting_verification','paid','failed','cancelled') DEFAULT 'pending',
  `paymentProof` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,NULL,'[{\"id\":32,\"name\":\"vada\",\"price\":\"3331.00\",\"image\":null,\"description\":\"vdv\",\"images\":[\"http://localhost:5001/uploads/1745779068257-blob\"],\"qty\":1}]',3331.00,'bca_va','pending',NULL,'2025-04-29 18:18:23','2025-04-29 18:18:23'),(2,NULL,'[{\"id\":32,\"name\":\"vada\",\"price\":\"3331.00\",\"image\":null,\"description\":\"vdv\",\"images\":[\"http://localhost:5001/uploads/1745779068257-blob\"],\"qty\":1}]',3331.00,'bca_va','pending',NULL,'2025-04-29 18:34:48','2025-04-29 18:34:48'),(3,NULL,'[{\"id\":33,\"name\":\"vava\",\"price\":\"31.00\",\"image\":null,\"description\":\"vva\",\"images\":[\"http://localhost:5001/uploads/1745860006360-5.jpg\"],\"qty\":1}]',31.00,'bca_va','pending',NULL,'2025-04-29 19:10:31','2025-04-29 19:10:31'),(4,NULL,'[{\"id\":33,\"name\":\"vava\",\"price\":\"31.00\",\"image\":null,\"description\":\"vva\",\"images\":[\"http://localhost:5001/uploads/1745860006360-5.jpg\"],\"qty\":1}]',31.00,'bca_va','pending',NULL,'2025-04-29 19:13:20','2025-04-29 19:13:20'),(5,NULL,'[{\"id\":33,\"name\":\"vava\",\"price\":\"31.00\",\"image\":null,\"description\":\"vva\",\"images\":[\"http://localhost:5001/uploads/1745860006360-5.jpg\"],\"qty\":1}]',31.00,'bca_va','pending',NULL,'2025-04-29 19:32:37','2025-04-29 19:32:37');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `images` text DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (29,'naju',11111.00,NULL,'v','[\"http://localhost:5001/uploads/1746192422468-blob\",\"http://localhost:5001/uploads/1746192581225-blob\",\"http://localhost:5001/uploads/1746193247266-blob\"]',15),(30,'celpon',1000.00,NULL,'vvd','[\"http://localhost:5001/uploads/1745778206126-blob\",\"http://localhost:5001/uploads/1745778206139-blob\"]',4),(32,'vada',1000.00,NULL,'vdv','[\"http://localhost:5001/uploads/1746172794941-blob\"]',0),(34,'dda',1000.00,NULL,'daa','[\"http://localhost:5001/uploads/1745992759977-blob\"]',1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'iqbalfauzi511@gmail.com','$2b$10$XRdwKc7LeG2QEqwDGMX5GuNnSkFz9dmqHN9NSP6Ni4nG/icUXxm3.');
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

-- Dump completed on 2026-02-01  0:02:45
