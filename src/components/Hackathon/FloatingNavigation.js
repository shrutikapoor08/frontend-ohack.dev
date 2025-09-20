import React, { useState, useEffect } from "react";
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  Box,
  useTheme,
  useMediaQuery,
  Typography
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  Timer as TimerIcon,
  Code as CodeIcon,
  VolunteerActivism as VolunteerIcon,
  School as MentorIcon,
  Gavel as JudgeIcon,
  Help as HelpIcon,
  KeyboardArrowUp as TopIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import { trackEvent } from "../../lib/ga";

const sectionConfig = [
  { id: "applications", name: "Apply Now", icon: <AssignmentIcon />, priority: 1, shortcut: "A" },
  { id: "nonprofit", name: "Projects", icon: <BusinessIcon />, priority: 2, shortcut: "P" },
  { id: "teams", name: "Teams", icon: <GroupIcon />, priority: 3, shortcut: "T" },
  { id: "stats", name: "Stats", icon: <BarChartIcon />, priority: 4, shortcut: "S" },
  { id: "countdown", name: "Countdown", icon: <TimerIcon />, priority: 5, shortcut: "C" },
  { id: "hacker", name: "Hackers", icon: <CodeIcon />, priority: 6, shortcut: "H" },
  { id: "volunteer", name: "Volunteers", icon: <VolunteerIcon />, priority: 7, shortcut: "V" },
  { id: "mentor", name: "Mentors", icon: <MentorIcon />, priority: 8, shortcut: "M" },
  { id: "judge", name: "Judges", icon: <JudgeIcon />, priority: 9, shortcut: "J" },
  { id: "faq", name: "FAQ", icon: <HelpIcon />, priority: 10, shortcut: "F" },
];

const FloatingNavigation = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Show/hide based on scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    sectionConfig.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Keyboard shortcuts when menu is open
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!open) return;

      // Prevent default behavior for our shortcuts
      const key = event.key.toUpperCase();
      
      // Handle Escape key to close menu
      if (key === 'ESCAPE') {
        setOpen(false);
        event.preventDefault();
        return;
      }

      // Handle number keys for top 10 sections
      if (key >= '1' && key <= '9') {
        const index = parseInt(key) - 1;
        if (index < sectionConfig.length) {
          const section = sectionConfig[index];
          handleSectionClick(section.id, section.name);
          event.preventDefault();
        }
        return;
      }

      // Handle '0' for the 10th section (FAQ)
      if (key === '0' && sectionConfig.length >= 10) {
        const section = sectionConfig[9]; // FAQ is 10th item (index 9)
        handleSectionClick(section.id, section.name);
        event.preventDefault();
        return;
      }

      // Handle letter shortcuts
      const section = sectionConfig.find(s => s.shortcut === key);
      if (section) {
        handleSectionClick(section.id, section.name);
        event.preventDefault();
      }

      // Handle special shortcuts
      if (key === 'B' || key === 'HOME') {
        handleBackToTop();
        event.preventDefault();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [open]);

  const handleSectionClick = (sectionId, sectionName) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Close the speed dial first
      setOpen(false);
      
      // Small delay to allow speed dial to close, then scroll
      setTimeout(() => {
        element.scrollIntoView({ 
          behavior: "smooth", 
          block: "start",
          inline: "nearest"
        });
        
        // Update URL hash
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", `#${sectionId}`);
        }
        
        // Track the event
        if (typeof trackEvent === 'function') {
          trackEvent({
            action: "floating_nav_click",
            params: { section_name: sectionName },
          });
        }
      }, 100);
    } else {
      console.warn(`Section element with id "${sectionId}" not found`);
      setOpen(false);
    }
  };

  const handleBackToTop = () => {
    setOpen(false);
    
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", window.location.pathname);
      }
      
      if (typeof trackEvent === 'function') {
        trackEvent({
          action: "back_to_top",
          params: { source: "floating_nav" },
        });
      }
    }, 100);
  };

  if (!isVisible) return null;

  // Show only top sections on mobile - create a new array instead of mutating
  const visibleSections = isMobile ? sectionConfig.slice(0, 6) : sectionConfig;
  
  // Create reversed array for display order (SpeedDial shows items bottom to top)
  const displaySections = [...visibleSections].reverse();

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <SpeedDial
        ariaLabel="Section navigation - Press keys when open for shortcuts"
        sx={{
          "& .MuiSpeedDial-fab": {
            bgcolor: "primary.main",
            "&:hover": {
              bgcolor: "primary.dark",
            },
            width: 56,
            height: 56,
          },
        }}
        icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<TopIcon />} />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
      >
        {/* Back to Top Action */}
        <SpeedDialAction
          key="top"
          icon={<TopIcon />}
          tooltipTitle="Back to Top (B)"
          tooltipPlacement="left"
          onClick={handleBackToTop}
          sx={{
            bgcolor: "secondary.main",
            "&:hover": {
              bgcolor: "secondary.dark",
            },
            position: 'relative',
            '&::after': {
              content: '"B"',
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '1px 3px',
              borderRadius: '2px',
              lineHeight: 1,
            }
          }}
        />

        {/* Section Actions */}
        {displaySections.map((section, index) => {
          const isActive = activeSection === section.id;
          const reverseIndex = displaySections.length - index;
          const shortcutKey = section.shortcut || reverseIndex.toString();
          
          return (
            <SpeedDialAction
              key={section.id}
              icon={section.icon}
              tooltipTitle={`${section.name} (${shortcutKey})`}
              tooltipPlacement="left"
              onClick={() => handleSectionClick(section.id, section.name)}
              sx={{
                bgcolor: isActive ? "primary.light" : "background.paper",
                color: isActive ? "primary.contrastText" : "text.primary",
                "&:hover": {
                  bgcolor: isActive ? "primary.main" : "action.hover",
                },
                ...(isActive && {
                  boxShadow: theme.shadows[8],
                  transform: "scale(1.1)",
                }),
                position: 'relative',
                '&::after': {
                  content: `"${shortcutKey}"`,
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  lineHeight: 1,
                }
              }}
            />
          );
        })}
      </SpeedDial>

      {/* Keyboard shortcut help overlay when menu is open */}
      {open && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: 2,
            borderRadius: 1,
            fontSize: '12px',
            maxWidth: 200,
            zIndex: 999,
          }}
        >
          <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
            Keyboard Shortcuts:
          </Typography>
          <Typography variant="caption" component="div">
            • Press letter keys (A, P, T, etc.)
          </Typography>
          <Typography variant="caption" component="div">
            • Press numbers 1-9, 0
          </Typography>
          <Typography variant="caption" component="div">
            • Press B for Back to Top
          </Typography>
          <Typography variant="caption" component="div">
            • Press Escape to close
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FloatingNavigation;
