const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

function cleanJson(text) {
    return text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
}

const interviewReportSchema = z.object({

    atsScore: z.number().describe(
        "Overall ATS friendliness score between 0 and 100 based on formatting, readability, organization, grammar and ATS compatibility."
    ),

    jobMatchScore: z.number().describe(
        "Overall job match score between 0 and 100 indicating how well the candidate matches the uploaded job description."
    ),

    technicalQuestions: z.array(
    z.object({
        question: z.string().min(10),
        intention: z.string().min(5),
        answer: z.string().min(75)
    })
),

behavioralQuestions: z.array(
    z.object({
        question: z.string().min(10),
        intention: z.string().min(5),
        answer: z.string().min(75)
    })
),

    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.enum(["low", "medium", "high"])
        })
    ),

    preparationPlan: z.array(
        z.object({
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string())
        })
    ),

    resumeImprovements: z.array(
        z.string()
    ).describe(
        "List of important improvements made while tailoring the resume."
    ),

    title: z.string()
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `
You are a Hiring Manager and Interviewer.

Your task is to evaluate a candidate ONLY using the information provided.

Input Sources

1. Resume
2. Self Description
3. Job Description

Never assume information.

Never invent experience.

Never infer skills that are not explicitly mentioned.

Never reward formatting.

Never reward writing style.

Evaluate only actual qualifications.

----------------------------------------------------
ATS SCORE
----------------------------------------------------

Generate an ATS Score out of 100.

The ATS Score evaluates ONLY the resume quality.

Consider:

• Resume structure

• Section ordering

• Readability

• ATS compatibility

• Grammar

• Professional formatting

• Action verbs

• Quantified achievements

Ignore the Job Description completely while calculating ATS Score.

----------------------------------------------------
JOB MATCH SCORE
----------------------------------------------------

Generate a Job Match Score out of 100.

This score evaluates ONLY how well the candidate matches the uploaded Job Description.

Scoring Rules

90–100

Reserve ONLY for exceptional candidates.

Nearly every required skill is demonstrated.

Projects and/or professional experience strongly align.

Very few missing requirements.

These scores should be rare.

80–89

Strong candidate.

Most required skills are present.

Only minor gaps.

Likely to receive an interview.

70–79

Good candidate.

Noticeable gaps exist.

Relevant projects compensate partially.

Interview possible.

60–69

Average match.

Fundamentals exist.

Several important technologies or requirements are missing.

40–59

Weak match.

Many required skills are absent.

Projects or experience only partially relate to the role.

0–39

Poor match.

Most required qualifications are missing.

Important Rules

• Required skills are significantly more important than preferred skills.

• Missing mandatory technologies should noticeably reduce the score.

• Professional experience carries more weight than coursework.

• Relevant projects carry more weight than certifications.

• Never increase the score because the resume is well written.

• Never assume knowledge of technologies that are not explicitly mentioned.

• If uncertain between two scores, choose the LOWER score.

----------------------------------------------------
TECHNICAL QUESTIONS
----------------------------------------------------

Generate technical interview questions(atleast 5) that are directly based on:

• the resume

• the projects

• technologies mentioned

• and the uploaded Job Description.

Avoid generic questions.

----------------------------------------------------
BEHAVIORAL QUESTIONS
----------------------------------------------------

Generate behavioral interview questions(atleast 3) focused on:

Leadership

Ownership

Conflict Resolution

Communication

Problem Solving

Adaptability

----------------------------------------------------
SKILL GAPS
----------------------------------------------------

Only include genuine missing skills.

Do NOT include generic skills like:

Communication

Leadership

Hardworking

Quick learner

Only include technical or role-specific skills.

Assign severity based on importance.

----------------------------------------------------
PREPARATION PLAN
----------------------------------------------------

Create a practical day-by-day preparation roadmap.

Each day's tasks should directly improve the identified skill gaps.

Avoid generic advice like

"Study DSA"

Instead be specific.

----------------------------------------------------
JOB TITLE
----------------------------------------------------

Extract the job title.

If unavailable, infer the most appropriate professional title.

----------------------------------------------------

Resume

${resume}

----------------------------------------------------

Self Description

${selfDescription}

----------------------------------------------------

Job Description

${jobDescription}
`;

    const response = await ai.models.generateContent({

        model: "gemini-3.5-flash",

        contents: prompt,

        config: {

            responseMimeType: "application/json",

            responseJsonSchema: z.toJSONSchema(interviewReportSchema)

        }

    });

    console.log("========== RESPONSE ==========");
    console.log(response.text);

    return JSON.parse(cleanJson(response.text));
}

async function generatePdfFromHtml(htmlContent) {

    const browser = await puppeteer.launch({
    headless: true,
    executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        "/opt/render/project/src/Backend/chrome/linux-152.0.7931.0/chrome-linux64/chrome",
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
    ]
});

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
        waitUntil: "networkidle0"
    });

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        },
        printBackground: true
    });

    await browser.close();

    return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("Complete ATS-friendly HTML resume.")
    });

    const prompt = `
Generate a professional, ATS-friendly resume for the candidate using the information below.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Instructions:

GENERAL

- Tailor the resume specifically for the uploaded Job Description.
- Optimize it for both recruiters and ATS systems.
- Use ONLY the information provided.
- Never invent projects.
- Never invent internships.
- Never invent companies.
- Never invent certifications.
- Never invent skills.
- Never invent achievements.
- Never invent metrics.
- Never exaggerate responsibilities.
- If information is missing, omit that section.

CONTENT

- Improve wording while preserving the original meaning.
- Never change the nature of the candidate's work.
- Never convert event management or club work into software engineering work.
- Preserve factual accuracy at all times.
- Use strong action verbs where appropriate.
- Remove repetitive wording.
- Naturally include important keywords from the Job Description wherever truthful.
- Do not keyword stuff.
- preserve all links as it is, dont convert them to plain text nor convert them to general links

LAYOUT

Create a clean, single-column professional resume.

Section order should generally be:

Header

Education

Experience

Projects

Technical Skills

Certifications

Achievements

Leadership / Extracurricular

Include only sections that contain information.

Do not create empty sections.

ATS REQUIREMENTS

The HTML must be ATS friendly.

Do NOT use:

- tables
- multiple columns
- floating layouts
- images
- SVG graphics
- icons
- charts
- text boxes
- canvas
- headers
- footers
- watermarks

Use:

- embedded CSS only
- Arial, Helvetica or Calibri
- black text
- white background
- A4 layout
- proper spacing
- right-aligned dates
- bullet points

The HTML should convert cleanly into PDF using Puppeteer.

STYLE

The resume should resemble a professionally written recruiter resume.

Keep it concise.

Keep it factual.

Keep it natural.

It should never appear AI-generated.

Return ONLY valid JSON:

{
  "html": "<complete HTML>"
}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(resumePdfSchema)
        }
    });

    console.log("========== RESUME ==========");
    console.log(response.text);

    const jsonContent = JSON.parse(cleanJson(response.text));

    return await generatePdfFromHtml(jsonContent.html);
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
};