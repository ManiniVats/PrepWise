import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf
} from "../services/interview.api"

import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const {
        loadingType,
        setLoadingType,
        loadingMessage,
        setLoadingMessage,
        report,
        setReport,
        reports,
        setReports
    } = context

    const generateReport = async ({
        jobDescription,
        selfDescription,
        resumeFile,
        onUploadProgress
    }) => {

        setLoadingType("report")
        setLoadingMessage("Analyzing your resume against the job description...")

        let response = null

        try {

            response = await generateInterviewReport({
                jobDescription,
                selfDescription,
                resumeFile,
                onUploadProgress
            })

            setReport(response.interviewReport)

        } catch (error) {

            console.error(error)
            throw error

        } finally {

            setLoadingType(null)
            setLoadingMessage("")

        }

        return response?.interviewReport
    }

    const getReportById = async (interviewId) => {

        setLoadingType("report")

        let response = null

        try {

            response = await getInterviewReportById(interviewId)

            setReport(response.interviewReport)

        } catch (error) {

            console.error(error)
            throw error

        } finally {

            setLoadingType(null)
            setLoadingMessage("")

        }

        return response?.interviewReport
    }

    const getReports = async () => {

        setLoadingType("reports")

        let response = null

        try {

            response = await getAllInterviewReports()

            setReports(response.interviewReports)

        } catch (error) {

            console.error(error)
            throw error

        } finally {

            setLoadingType(null)
            setLoadingMessage("")

        }

        return response?.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {

        setLoadingType("resume")
        setLoadingMessage("Generating your ATS-friendly resume...")

        let response = null

        try {

            response = await generateResumePdf({
                interviewReportId
            })

            const url = window.URL.createObjectURL(
                new Blob([response], {
                    type: "application/pdf"
                })
            )

            const link = document.createElement("a")

            link.href = url

            link.setAttribute(
                "download",
                `resume_${interviewReportId}.pdf`
            )

            document.body.appendChild(link)

            link.click()

            window.URL.revokeObjectURL(url)

        } catch (error) {

            console.error(error)
            throw error

        } finally {

            setLoadingType(null)
            setLoadingMessage("")

        }

    }

    useEffect(() => {

        const loadData = async () => {

            try {

                if (interviewId) {

                    await getReportById(interviewId)

                } else {

                    await getReports()

                }

            } catch (error) {

                console.error(error)

            }

        }

        loadData()

    }, [interviewId])

    return {
        loadingType,
        loadingMessage,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf
    }

}