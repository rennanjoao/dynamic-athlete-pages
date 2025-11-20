import { motion } from "framer-motion";

interface HoverBlockProps {
  title: string;
  img: string;
}

export const HoverBlock = ({ title, img }: HoverBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      whileHover={{ scale: 1.03 }}
      className="relative h-32 bg-card border border-border rounded-xl flex items-center justify-center text-xl font-semibold shadow-md cursor-pointer overflow-hidden card-hover"
    >
      <span className="relative z-10 text-foreground">{title}</span>
      <motion.img
        src={img}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-0"
        whileHover={{ opacity: 0.15 }}
      />
    </motion.div>
  );
};
