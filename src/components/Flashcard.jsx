import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Flashcard = ({ question, answer }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="group h-64 w-full perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative w-full h-full text-center transition-all duration-500 transform-style-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front (Question) */}
                <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Question</span>
                    <p className="text-lg font-medium text-zinc-800 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                        {question}
                    </p>
                    <span className="absolute bottom-4 text-xs text-zinc-400">Click to flip</span>
                </div>

                {/* Back (Answer) */}
                <div
                    className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 bg-primary/5 border border-primary/20 rounded-xl shadow-sm"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Answer</span>
                    <p className="text-lg font-medium text-zinc-800 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                        {answer}
                    </p>
                    <span className="absolute bottom-4 text-xs text-zinc-400">Click to flip back</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Flashcard;
