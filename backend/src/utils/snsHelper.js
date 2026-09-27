const { PublishCommand } = require('@aws-sdk/client-sns');
const { snsClient, snsTopicArn } = require('../config/aws');

/**
 * Send SNS notification
 * @param {string} message - Notification message
 * @param {string} subject - Email subject
 * @returns {Promise<void>}
 */
const sendNotification = async (message, subject = 'AttendX Notification') => {
  try {
    const command = new PublishCommand({
      TopicArn: snsTopicArn,
      Message: message,
      Subject: subject,
    });

    const response = await snsClient.send(command);
    console.log('SNS Notification sent:', response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error('SNS Error:', error);
    throw new Error('Failed to send notification');
  }
};

/**
 * Send attendance completion notification
 * @param {Object} sessionData - Session information
 * @returns {Promise<void>}
 */
const sendAttendanceNotification = async (sessionData) => {
  const { facultyName, subjectName, className, presentCount, totalStudents, sessionDate } = sessionData;
  
  const message = `
Attendance Marked Successfully

Faculty: ${facultyName}
Subject: ${subjectName}
Class: ${className}
Date: ${sessionDate}

Students Present: ${presentCount}/${totalStudents}
Percentage: ${((presentCount / totalStudents) * 100).toFixed(2)}%

---
AttendX Automated Attendance System
  `.trim();

  const subject = `Attendance Complete - ${subjectName} - ${className}`;
  
  return sendNotification(message, subject);
};

module.exports = {
  sendNotification,
  sendAttendanceNotification
};
