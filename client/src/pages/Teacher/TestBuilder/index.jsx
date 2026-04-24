import { useState } from 'react';
import QuestionPapers from '../ExamZone/QuestionPapers';

const TestBuilder = () => {
    return (
        <div>
            {/* Zone Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Test Builder</h1>
                    <p className="text-sm text-slate-500">Create reusable question papers — each paper can be used to run multiple exams</p>
                </div>
            </div>

            {/* Content */}
            <QuestionPapers />
        </div>
    );
};

export default TestBuilder;
