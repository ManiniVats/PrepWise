import { createContext, useState } from "react";

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {

    // null | "report" | "reports" | "resume"
    const [loadingType, setLoadingType] = useState(null);

    const [loadingMessage, setLoadingMessage] = useState("");

    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);

    return (
        <InterviewContext.Provider
            value={{
                loadingType,
                setLoadingType,

                loadingMessage,
                setLoadingMessage,

                report,
                setReport,

                reports,
                setReports,
            }}
        >
            {children}
        </InterviewContext.Provider>
    );
};