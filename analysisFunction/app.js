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
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "n140471@rguktn.ac.in",
    pass: "gvrcxuflxrxmecop"
  }
});

exports.handler = async (event) => {
  const records = event.Records
  console.log(JSON.stringify(event, null, 2))

  try {
    await Promise.all(
      records.map(async (record) => {
        console.log('Incoming record: ', record)

        const fileName = record.s3.object.key;

        // Load JSON object
        const response = await getS3object({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key
        })
        // Extract the transcript
        const originalText = JSON.parse(response.Body.toString('utf-8'))
        console.log('---- originalText: ', originalText)

        if (fileName.startsWith('tagged')) {
          console.log('---- tagged called', originalText.results.items)
          const sosWordsFound = originalText.results.items.find(item => item.vocabularyFilterMatch)
          if (sosWordsFound) {
            console.log('---- SOS word found');
            const resp = await sendMail();
            console.log('----- email resp:', resp);
          }
        } else if (fileName.startsWith('toxicity-detected')) {
          console.log('---- toxicity detected called', originalText.results.toxicity_detection);

          const incidentChance = originalText.results.toxicity_detection.find((item) => {
            return Object.keys(item.categories).find(key => item.categories[key] >= 0.5)
          });
          if (incidentChance) {
            console.log('---- There is a toxic situation found and reported it to incident team');
            const resp = await sendMail();
            console.log('----- email resp:', resp);
          }
        }
      })
    )
  } catch (err) {
    console.error(err)
  }
}

const sendMail = async () => {
  const mailOptions = {
    from: 'n140471@rguktn.ac.in',
    to: 'dhanalakshmi.narala@mable.com.au',
    subject: `Incident detected`,
    html: `<h1>SP 123 or client 234 is at risk. Please act immediately</h1></br><h3>The audio contains more details about incident: Link </h3>`
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        resolve(info);
        console.log('Email sent: ' + info.response);
      }
    });
  })
}



