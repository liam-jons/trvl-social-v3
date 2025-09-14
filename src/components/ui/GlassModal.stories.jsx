import { useState } from 'react';
import GlassModal from './GlassModal';
import GlassButton from './GlassButton';

export default {
  title: 'Glassmorphic/GlassModal',
  component: GlassModal,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gradient',
      values: [
        {
          name: 'gradient',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'light',
          value: '#f3f4f6',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    showCloseButton: {
      control: 'boolean',
    },
    closeOnOverlayClick: {
      control: 'boolean',
    },
    closeOnEsc: {
      control: 'boolean',
    },
  },
};

const ModalDemo = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GlassButton variant="primary" onClick={() => setIsOpen(true)}>
        Open Modal
      </GlassButton>
      <GlassModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export const Default = {
  render: ModalDemo,
  args: {
    title: 'Default Modal',
    children: (
      <p className="text-gray-600 dark:text-gray-300">
        This is a glassmorphic modal with default settings. It can be closed by
        clicking the X button, clicking outside, or pressing ESC.
      </p>
    ),
  },
};

export const SmallSize = {
  render: ModalDemo,
  args: {
    title: 'Small Modal',
    size: 'sm',
    children: (
      <p className="text-gray-600 dark:text-gray-300">
        This is a small modal, perfect for simple confirmations.
      </p>
    ),
  },
};

export const LargeSize = {
  render: ModalDemo,
  args: {
    title: 'Large Modal',
    size: 'lg',
    children: (
      <div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This is a large modal with more content space.
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        </p>
      </div>
    ),
  },
};

export const WithActions = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <GlassButton variant="primary" onClick={() => setIsOpen(true)}>
          Open Modal with Actions
        </GlassButton>
        <GlassModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to proceed with this action? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <GlassButton variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </GlassButton>
          </div>
        </GlassModal>
      </>
    );
  },
};

export const WithForm = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <GlassButton variant="primary" onClick={() => setIsOpen(true)}>
          Open Form Modal
        </GlassButton>
        <GlassModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Contact Form"
          size="md"
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 glass-blur-sm bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 glass-blur-sm bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                className="w-full px-3 py-2 glass-blur-sm bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="Enter your message"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <GlassButton variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" onClick={() => setIsOpen(false)}>
                Submit
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      </>
    );
  },
};

export const NoCloseButton = {
  render: ModalDemo,
  args: {
    title: 'Modal without Close Button',
    showCloseButton: false,
    children: (
      <div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This modal doesn't have a close button. You can still close it by
          clicking outside or pressing ESC.
        </p>
        <GlassButton variant="primary" className="w-full">
          Got it
        </GlassButton>
      </div>
    ),
  },
};

export const NoOverlayClose = {
  render: ModalDemo,
  args: {
    title: 'Persistent Modal',
    closeOnOverlayClick: false,
    children: (
      <p className="text-gray-600 dark:text-gray-300">
        This modal cannot be closed by clicking outside. You must use the close
        button or press ESC.
      </p>
    ),
  },
};