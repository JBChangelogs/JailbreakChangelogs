'use client';

import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    "question": "What is Jailbreak?",
    "answer": "Jailbreak is a 12-time award-winning game where you can orchestrate a robbery or catch criminals! Team up with friends for even more fun and plan the ultimate police raid or criminal heist. It can be played <a href=\"https://www.roblox.com/games/606849621/Jailbreak\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">here</a> and is made by <a href=\"https://www.roblox.com/communities/3059674/Badimo#!/about\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">Badimo</a>."
  },
  {
    "question": "Who are the creators of Jailbreak?",
    "answer": "Jailbreak was created by Badimo, a development team consisting primarily of <a href=\"https://x.com/asimo3089\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">asimo3089</a> and <a href=\"https://x.com/badccvoid\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">badcc</a>. asimo3089 focuses on game design, while badcc handles the technical aspects of development. Together, they've turned Jailbreak into one of the most popular and enduring games on the Roblox platform, continuously updating and improving it since its release in 2017."
  },
  {
    "question": "What platforms is Jailbreak available on?",
    "answer": "Jailbreak is available on Roblox, which can be played on PC, mobile devices, and consoles."
  },
  {
    "question": "Are there any in-game purchases?",
    "answer": "Yes, Jailbreak offers in-game purchases for items and upgrades, but the game can be enjoyed without spending money."
  },
  {
    "question": "How often is Jailbreak updated?",
    "answer": "Jailbreak's update schedule has changed over time. Previously, the game received monthly updates. However, as of April 2024, Badimo announced that they would be discontinuing the monthly update cycle. The new update schedule is more flexible, allowing for both larger, less frequent updates and smaller, more frequent patches as needed. This change aims to provide higher quality content and address issues more efficiently."
  },
  {
    "question": "What are seasons in Jailbreak?",
    "answer": "Seasons in Jailbreak are limited-time events that introduce new content, challenges, and rewards. Each season typically has a unique theme and offers items that players can earn by completing contracts or purchasing a season pass to unlock more prizes."
  },
  {
    "question": "Is there a way to report bugs or issues in the game?",
    "answer": "Players can report bugs through the official Discord server or by using this form: <a href=\"https://forms.gle/FHSEsGGAknfqeSdB7\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">Report Form</a>."
  },
  {
    "question": "Is there a way to follow Jailbreak news and updates?",
    "answer": "Players can follow <a href=\"https://x.com/badimo\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">Badimo</a>, <a href=\"https://x.com/asimo3089\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">asimo3089</a>, and <a href=\"https://x.com/badccvoid\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">badcc</a> on X, join the game's official Discord at <a href=\"https://discord.gg/jailbreak\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">discord.gg/jailbreak</a>, or participate in the Reddit community at <a href=\"https://www.reddit.com/r/robloxjailbreak\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">r/robloxjailbreak</a>."
  },
  {
    "question": "Why was the Jailbreak Changelogs website created?",
    "answer": "The website was created to provide a central hub for all Jailbreak Changelog updates, reward details, and season information. It's a convenient place to stay informed about the latest changes and explore the evolution of Jailbreak over time."
  },
  {
    "question": "Where are the changelogs sourced from among the other data?",
    "answer": "Changelogs are sourced from the <a href=\"https://jailbreak.fandom.com/wiki/Jailbreak_Wiki:Home\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">Jailbreak Wiki</a>, the official Discord changelogs channel, Twitter posts by <a href=\"https://x.com/badimo\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">Badimo</a>, <a href=\"https://x.com/asimo3089\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">asimo3089</a>, and <a href=\"https://x.com/badccvoid\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">badcc</a>, as well as community contributions."
  },
  {
    "question": "What is the Users page for?",
    "answer": "The Users page is a community feature that allows users to create and customize their profiles on Jailbreak Changelogs. Users can:<br>1. Sign in with Discord to create a profile<br>2. Customize their profile with a bio and banner image<br>3. Follow other users and be followed<br>4. View and manage their comments on changelogs and seasons<br>5. Control privacy settings for their profile<br>This feature helps build a community around Jailbreak and allows players to connect with others who share their interest in the game."
  },
  {
    "question": "How do I report issues with the website?",
    "answer": "To report website issues:<br>1. Visit the <a href='/?report-issue=true' class=\"text-blue-400 hover:text-blue-300  underline\">report issue modal</a> or use the Report An Issue button at the bottom of any page<br>2. You must be logged in with Discord to submit issues<br>3. Follow these requirements:<br>&nbsp;&nbsp;• Issue Title must be at least 10 characters<br>&nbsp;&nbsp;• Description must be at least 25 characters<br>4. After submission, your issue will appear in our <a href='https://discord.gg/invite/kAuxDntHG9' target='_blank' rel='noopener noreferrer' class=\"text-blue-400 hover:text-blue-300  underline\">Discord server</a>'s issues channel"
  },
  {
    "question": "How can I create trade ads?",
    "answer": "To create trade ads, follow these steps:<br>1. Log in with Discord by clicking the Login button in the top right (if you see your avatar and username in the top right, you're already logged in)<br>2. Click your avatar and select 'Authenticate with Roblox' from the dropdown<br>3. Once authenticated, you can now create trade ads and make offers<br><br>Note: Roblox authentication is a one-time process. Future trade ads will only require Discord authentication if you've been logged out"
  },
  {
    "question": "How can I suggest new values for items on the Values page?",
    "answer": "Not happy with a value you see? If you think an item's value should be lower or higher, you can:<br>1. Join the Trading Discord at <a href='https://discord.gg/jailbreaktrading' target='_blank' rel='noopener noreferrer' class=\"text-blue-400 hover:text-blue-300  underline\">discord.gg/jailbreaktrading</a><br>2. Navigate to their #value-suggestions channel<br>3. Submit your suggestion with reasoning<br><br>If approved, the updated value will appear on our website."
  },
  {
    "question": "How can I connect with JBChangelogs?",
    "answer": "There are several ways to connect with us:<br>1. Join our Discord server at <a href=\"https://discord.gg/invite/kAuxDntHG9\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">discord.gg/invite/kAuxDntHG9</a> to trade, hang out, and discuss the website<br>2. Follow us on X (Twitter) at <a href=\"https://x.com/JBChangelogs\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">@JBChangelogs</a> for website updates and announcements<br>3. Join our Roblox group at <a href=\"https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">Jailbreak Changelogs Group</a><br>4. Follow us on Bluesky at <a href=\"https://bsky.app/profile/jbchangelogs.bsky.social\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">@jbchangelogs.bsky.social</a>"
  },
  {
    "question": "Who can I contact if I have questions or need assistance?",
    "answer": "If you need assistance with the website, you can reach out to these Discord users: <a href=\"https://discord.com/users/659865209741246514\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">@jakobiis</a> or <a href=\"https://discord.com/users/1019539798383398946\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-400 hover:text-blue-300  underline\">@jalenzz</a>. Please note that these are Discord usernames and links to the individual profiles."
  },
  {
    "question": "What data is collected when I log in with Discord or Roblox?",
    "answer": "We only collect data when you choose to authenticate:<br><br><strong>Discord Authentication:</strong><br>• Discord User ID<br>• Discord Avatar<br>• Discord Username and Global Name<br>• Discord Banner<br><br><strong>Roblox Authentication:</strong><br>• Roblox Username<br>• Roblox Player ID<br>• Roblox Display Name<br>• Roblox Avatar<br>• Roblox Join Date<br><br>Important: We only collect publicly available information, and only when you choose to log in. Users who browse without authentication have no personal data stored."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#2E3944] p-8 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: 'url(https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background5.webp)' }}
      />
      <div className="absolute inset-0 bg-[#2E3944] opacity-60" />
      <div className="max-w-4xl mx-auto relative">
        <Breadcrumb />
        <div className="flex items-center gap-2 mb-2">
          <QuestionMarkCircleIcon className="h-6 w-6 text-muted" />
          <h1 className="text-2xl font-bold text-muted">Frequently Asked Questions</h1>
        </div>
        <p className="text-md text-muted mb-2">Find answers to common questions about Roblox Jailbreak and our Website</p>
        <p className="text-xs text-muted mb-6">Last updated: June 19th, 2025</p>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              defaultExpanded={index === 0}
              sx={{
                backgroundColor: '#212A31',
                color: '#D3D9D4',
                '&:before': {
                  display: 'none',
                },
                border: '1px solid #2E3944',
                '& .MuiAccordionSummary-root': {
                  '&:hover': {
                    backgroundColor: '#1A2025',
                  },
                },
                '&:hover': {
                  borderColor: '#5865F2',
                },
                transition: 'border-color 0.2s ease-in-out',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#D3D9D4' }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography className="font-semibold">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  className="text-muted"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  );
} 