import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useTour() {
  function startTour(): void {
    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0,0,0,0.55)',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      steps: [
        {
          element: '[data-tour="tree"]',
          popover: {
            title: 'Folder tree',
            description:
              'Browse the full folder structure here. Click a folder to open it; use the arrows to expand or collapse.',
          },
        },
        {
          element: '[data-tour="tree-toolbar"]',
          popover: {
            title: 'Tree actions',
            description:
              'Collapse everything, create a new folder, or open the Recycle Bin.',
          },
        },
        {
          element: '[data-tour="search"]',
          popover: {
            title: 'Search',
            description: 'Find folders and files by name across the whole tree.',
          },
        },
        {
          element: '[data-tour="content"]',
          popover: {
            title: 'Contents',
            description:
              'The selected folder’s items appear here. Single-click to select, Ctrl/Shift-click for multi-select, or drag a box to marquee-select. Double-click a folder to open it, or a file to preview it.',
          },
        },
        {
          element: '[data-tour="content-toolbar"]',
          popover: {
            title: 'View & upload',
            description:
              'Switch between grid and list, and upload files (or drag files from your computer onto this area).',
          },
        },
        {
          element: '[data-tour="preview-toggle"]',
          popover: {
            title: 'Preview panel',
            description:
              'Show or hide the preview panel. Double-click a file to preview images, PDFs, video, audio, and text.',
          },
        },
        {
          element: '[data-tour="theme-toggle"]',
          popover: {
            title: 'Theme',
            description: 'Switch between light and dark mode.',
          },
        },
        {
          element: '[data-tour="help"]',
          popover: {
            title: 'Need help again?',
            description:
              'Reopen this tour any time from here. Enjoy exploring!',
          },
        },
      ],
    });
    d.drive();
  }

  return { startTour };
}
