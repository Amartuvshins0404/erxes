import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";

import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconBrandInstagramFilled,
  IconBrandLinkedinFilled,
  IconMailFilled,
} from '@tabler/icons-react';

const COMING_SOON_VIDEO_SRC =
  'https://pub-3bcba1ff529f4ce3bf25b4e16962c239.r2.dev/intro.mp4';
const Socials = [
  {
    icon: <IconMailFilled className="size-5" />,
    url: 'mailto:info@erxes.io',
  },
  {
    icon: <IconBrandInstagramFilled className="size-5" />,
    url: 'https://www.instagram.com/erxeshq/',
  },
  {
    icon: <IconBrandLinkedinFilled className="size-5" />,
    url: 'https://www.linkedin.com/company/erxes/',
  },
  {
    icon: <IconBrandGithubFilled className="size-5" />,
    url: 'https://github.com/erxes',
  },
  {
    icon: <IconBrandDiscordFilled className="size-5" />,
    url: 'https://discord.gg/qEaghUeG5C',
  },
];

const SocialSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.0 }}
  >
    <h3 className="mb-4 font-medium text-muted-foreground text-base text-center">
      Contact Us:
    </h3>
    <div className="flex flex-wrap justify-center gap-2">
      {Socials.map((item) => {
        return (
          <a
            href={item.url}
            key={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="bg-muted p-[6px] rounded-sm text-muted-foreground">
              {item.icon}
            </div>
          </a>
        );
      })}
    </div>
  </motion.div>
);

export const Widgets = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col justify-center px-4 sm:px-8 md:px-20 lg:px-4 xl:px-12 py-12 h-full container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative space-y-8 mx-auto min-w-0 max-w-5xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 text-center"
        >
          <div className="bg-clip-text w-full font-semibold text-2xl tracking-tight">
            <h1 className="inline capitalize">Welcome to Agent </h1>
          </div>
        </motion.div>

        {/* Clickable Section to navigate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full cursor-pointer rounded-xl border border-foreground/10 bg-background p-12 text-center hover:bg-muted transition"
          onClick={() => navigate("/agent")}
        >
          <h2 className="text-xl font-semibold">Go to Agents</h2>
          <p className="text-muted-foreground mt-2">Click here to create a new agent</p>
        </motion.div>

        <SocialSection />
      </motion.div>
    </div>
  );
};


export default Widgets;
