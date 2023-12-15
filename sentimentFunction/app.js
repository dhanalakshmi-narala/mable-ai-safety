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
const comprehend = new AWS.Comprehend()

const { getS3object, putS3object }  = require('./s3')
const documentClient = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  const records = event.Records
  console.log (JSON.stringify(event, null, 2))

  try {
    await Promise.all(
      records.map(async (record) => {
        console.log('Incoming record: ', record)

        // Load JSON object
        const response = await getS3object({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key
        })
        // Extract the transcript
        const originalText = JSON.parse(response.Body.toString('utf-8'))
        const transcript = originalText.results.transcripts[0].transcript

        // Do sentiment analysis
        console.log('Transcript: ', transcript)
        //TODO Here we have do analysis on the result we got from the Transcribe and (toxic from Comprehend Or toxic from Transcribe file)
        const sentiment = await doSentimentAnalysis(transcript)
       
        
        console.log ('sentiment: ', {sentiment})
        // .json====> needed words,
        // sentiment===>
      })
    )
  } catch (err) {
    console.error(err)
  }
}

const doSentimentAnalysis = async (Text) => {
  const params = {
    LanguageCode: 'en',
    TextSegments: Text.split(' ')
  }

  const result = await comprehend.detectToxicContent(params).promise()
  console.log('doSentimentAnalysis: ', result)
  return result
}
