-- Add MCA 2025 Students
-- Password for all students: student123
-- Hash: $2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq

-- Delete existing sample students first
DELETE FROM students WHERE email LIKE '%@student.edu';

-- CLASS A (22 students)
INSERT INTO students (roll_no, name, email, password_hash, class, semester, department, is_active) VALUES
('25MCA001', 'Aaditya Sanjay Gandhi', '25mca001@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA002', 'Agarwal Dev Ajay', '25mca002@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA003', 'Aghera Deep Mukeshbhai', '25mca003@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA004', 'Bahelim Shifa', '25mca004@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA005', 'Baman Shyam', '25mca005@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA006', 'Bhoraniya Savan Bharatbhai', '25mca006@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA007', 'Bhut Mohamadkiflen Abdulkadar', '25mca007@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA008', 'Chandel Tejas Singh Ramesh Singh', '25mca008@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA009', 'Chaudhari Aryan Pravinbhai', '25mca009@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA010', 'Nirali Chaudhary Rameshsingh', '25mca010@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA011', 'Ritu Pareshbhai Chauhan', '25mca011@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA012', 'Dauwa Yash Devendabhai', '25mca012@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA013', 'Dubal Bhavya Ramesh', '25mca013@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA014', 'Gajjar Vanshika Mihirkumar', '25mca014@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA016', 'Hemil Nilesh Gandhi', '25mca016@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA017', 'Garg Shubham Bhuvneshkumar', '25mca017@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA018', 'Kotadiya Niraj Rajeshbhai', '25mca018@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA019', 'Dhruvi Paragbhai Lolariya', '25mca019@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA020', 'Makhijani Shubh', '25mca020@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA024', 'Mevada Pratham Dilipkumar', '25mca024@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA025', 'Modi Aksh Janakbhai', '25mca025@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1),
('25MCA026', 'Murani Ronak Yogeshbhai', '25mca026@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'A', 3, 'Computer Science', 1);

-- CLASS B (22 students)
INSERT INTO students (roll_no, name, email, password_hash, class, semester, department, is_active) VALUES
('25MCA027', 'Nirmay Samir Choksi', '25mca027@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA028', 'Panchal Drashti Udaykumar', '25mca028@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA029', 'Panchani Niral Ashvinbhai', '25mca029@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA030', 'Pratyaksh Bhavesh Parekh', '25mca030@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA032', 'Akshaykumar Nareshbhai Patel', '25mca032@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA033', 'Patel Dhruv Alpeshkumar', '25mca033@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA034', 'Patel Kruti Parimal', '25mca034@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA035', 'Patel Sneh Dineshkumar', '25mca035@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA037', 'Poria Milan', '25mca037@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA038', 'Vinisha Prajapati', '25mca038@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA039', 'Preety Sharma', '25mca039@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA041', 'Shreya Rana', '25mca041@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA042', 'Rathod Rutwa Bhupendrabhai', '25mca042@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA043', 'Param Hemant Sachani', '25mca043@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA044', 'Devanshi Jatin Sanghvi', '25mca044@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA045', 'Sathwara Bhavin', '25mca045@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA046', 'Tirth Hiteshbhai Sevak', '25mca046@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA047', 'Aayush Nilesh Shah', '25mca047@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA048', 'Arjav Bijalbhai Shah', '25mca048@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA049', 'Dhruvil Sandipbhai Shah', '25mca049@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA050', 'Komal Jayprakash Shah', '25mca050@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1),
('25MCA052', 'Nishva Prashant Shah', '25mca052@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'B', 3, 'Computer Science', 1);

-- CLASS C (23 students)
INSERT INTO students (roll_no, name, email, password_hash, class, semester, department, is_active) VALUES
('25MCA053', 'Prasham Amitbhai Shah', '25mca053@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA054', 'Riti Pragnesh Shah', '25mca054@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA055', 'Vivaan Shah', '25mca055@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA056', 'Shivam Hiteshbhai Sonani', '25mca056@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA057', 'Krunal Brijeshbhai Soni', '25mca057@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA058', 'Virangi Kishorbhai Tank', '25mca058@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA059', 'Fahad Suhelbhai Teli', '25mca059@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA060', 'Dhairya Thacker', '25mca060@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA061', 'Heer Thakkar', '25mca061@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA062', 'Thakkar Yatin Gopalbhai', '25mca062@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA063', 'Niyati Trivedi', '25mca063@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA064', 'Vaghasia Soham Prashantbhai', '25mca064@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA065', 'Vrushil Dineshbhai Makwana', '25mca065@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA066', 'Shaan Bhargav Raval', '25mca066@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1),
('25MCA067', 'Sara Nilesh Panchani', '25mca067@nirmauni.ac.in', '$2a$10$hie.X7Q.vw0RewH4KsCWhOEgv3QHEajD359DIdevM7Zlw5nEyGLsq', 'C', 3, 'Computer Science', 1);

-- Summary
SELECT 
    class,
    COUNT(*) as student_count
FROM students
WHERE roll_no LIKE '25MCA%'
GROUP BY class
ORDER BY class;

SELECT 'Total Students Added:' as message, COUNT(*) as count
FROM students
WHERE roll_no LIKE '25MCA%';
