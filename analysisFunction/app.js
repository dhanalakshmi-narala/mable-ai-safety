/*
  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict'

const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION

const { createTransport } = require('nodemailer');
const { getS3object } = require('./s3')

const transporter = createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'daija.stroman49@ethereal.email',
    pass: 'U83FSdFyF4ejSYjm27'
  }
});

exports.handler = async (event) => {
  const records = event.Records
  console.log(JSON.stringify(event, null, 2))

  try {
    await Promise.all(
      records.map(async (record) => {
        console.log('Incoming record: ', record)

        const bucketName = record.s3.bucket.name;
        // Load JSON object
        const response = await getS3object({
          Bucket: bucketName,
          Key: record.s3.object.key
        })
        // Extract the transcript
        const originalText = JSON.parse(response.Body.toString('utf-8'))


        console.log('----- originalText', originalText.toxicity_detection);

        // if (originalText.toxicity_detection) {
        //   originalText.toxicity_detection.categories
        // }

      })
    )
  } catch (err) {
    console.error(err)
  }
}

const sendMail = async () => {
  const mailOptions = {
    from: 'daija.stroman49@ethereal.email',
    to: 'dhanalakshmi.narala@mable.com.au',
    subject: `Incident detected`,
    text: `SP or client is at risk. Please act immediately`
  };

  const resp = await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  console.log({ resp })
}



