import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TypingTextProps {
  text: string;
  repeatChars?: number;
  className?: string;
  delay?: number;
}

export const TypingText = ({
  text,
  repeatChars = 5,
  className = "",
  delay = 0,
}: TypingTextProps) => {
  // Split the text based on how many characters should be re-typed
  // "Autonomously." (13) with repeatChars=7 -> "Autono" + "mously."
  const splitIndex = text.length - repeatChars;
  const baseText = text.slice(0, splitIndex);
  const animText = text.slice(splitIndex);

  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    let index = animText.length;
    let isDeleting = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      // Calculate current substring
      const currentAnimText = animText.substring(0, index);
      setDisplayedText(baseText + currentAnimText);

      // Determine next step
      let typingSpeed = 100; // Base speed

      if (isDeleting) {
        typingSpeed = 75; // Deleting is faster
        index--;
      } else {
        typingSpeed = 120; // Typing is slightly slower/varied
        index++;
      }

      // Logic for changing direction
      if (!isDeleting && index === animText.length) {
        // Finished typing
        isDeleting = true;
        typingSpeed = 2000; // Pause at end before deleting
      } else if (isDeleting && index === 0) {
        // Finished deleting
        isDeleting = false;
        typingSpeed = 500; // Pause before typing again
      }

      timeoutId = setTimeout(tick, typingSpeed);
    };

    // Start delay
    timeoutId = setTimeout(tick, delay + 2000);

    return () => clearTimeout(timeoutId);
  }, [baseText, animText, delay]);

  return (
    <span className={className}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="inline-block w-[2px] h-[0.9em] bg-accent-secondary ml-[1px] align-baseline translate-y-[2px]"
      />
    </span>
  );
};
