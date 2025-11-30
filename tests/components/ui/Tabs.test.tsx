import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '../../../app/components/ui/Tabs';

describe('Tabs', () => {
  describe('Uncontrolled mode', () => {
    it('should render tabs and panels correctly', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
            <Tab value="tab3">Tab 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
            <TabPanel value="tab3">Content 3</TabPanel>
          </TabPanels>
        </Tabs>
      );

      // All tabs should be visible
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();

      // Only the default panel should be visible
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('should switch tabs on click', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      // Initially showing tab1 content
      expect(screen.getByText('Content 1')).toBeInTheDocument();

      // Click on tab2
      fireEvent.click(screen.getByText('Tab 2'));

      // Should show tab2 content
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

    it('should apply correct ARIA attributes', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList aria-label="Test tabs">
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      // TabList should have role="tablist"
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Test tabs');

      // Tabs should have role="tab"
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      // Active tab should have aria-selected="true"
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      // TabPanels should have role="tabpanel"
      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
    });

    it('should call onChange when tab changes', () => {
      const handleChange = vi.fn();

      render(
        <Tabs defaultValue="tab1" onChange={handleChange}>
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      fireEvent.click(screen.getByText('Tab 2'));

      expect(handleChange).toHaveBeenCalledWith('tab2');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Controlled mode', () => {
    it('should work in controlled mode', () => {
      const { rerender } = render(
        <Tabs value="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      // Clicking should not change tabs in controlled mode without onChange
      fireEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 1')).toBeInTheDocument();

      // Parent component controls the value
      rerender(
        <Tabs value="tab2">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should use onChange in controlled mode', () => {
      const handleChange = vi.fn();

      render(
        <Tabs value="tab1" onChange={handleChange}>
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      fireEvent.click(screen.getByText('Tab 2'));

      expect(handleChange).toHaveBeenCalledWith('tab2');
      // Content should not change automatically (controlled by parent)
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('should support horizontal orientation (default)', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('should support vertical orientation', () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('Keyboard navigation', () => {
    it('should navigate with arrow keys (horizontal)', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
            <Tab value="tab3">Tab 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
            <TabPanel value="tab3">Content 3</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      // Right arrow -> tab2
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      const tab2 = screen.getByText('Tab 2');
      expect(document.activeElement).toBe(tab2);

      // Right arrow -> tab3
      fireEvent.keyDown(tab2, { key: 'ArrowRight' });
      expect(screen.getByText('Content 3')).toBeInTheDocument();

      const tab3 = screen.getByText('Tab 3');
      expect(document.activeElement).toBe(tab3);

      // Right arrow (wraps to tab1)
      fireEvent.keyDown(tab3, { key: 'ArrowRight' });
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(document.activeElement).toBe(tab1);

      // Left arrow -> tab3
      fireEvent.keyDown(tab1, { key: 'ArrowLeft' });
      expect(screen.getByText('Content 3')).toBeInTheDocument();
      expect(document.activeElement).toBe(tab3);
    });

    it('should navigate with arrow keys (vertical)', () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      // Down arrow -> tab2
      fireEvent.keyDown(tab1, { key: 'ArrowDown' });
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      const tab2 = screen.getByText('Tab 2');
      expect(document.activeElement).toBe(tab2);

      // Up arrow -> tab1
      fireEvent.keyDown(tab2, { key: 'ArrowUp' });
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(document.activeElement).toBe(tab1);
    });

    it('should navigate to first tab with Home key', () => {
      render(
        <Tabs defaultValue="tab2">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
            <Tab value="tab3">Tab 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
            <TabPanel value="tab3">Content 3</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      tab2.focus();

      fireEvent.keyDown(tab2, { key: 'Home' });

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(document.activeElement).toBe(screen.getByText('Tab 1'));
    });

    it('should navigate to last tab with End key', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
            <Tab value="tab3">Tab 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
            <TabPanel value="tab3">Content 3</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      fireEvent.keyDown(tab1, { key: 'End' });

      expect(screen.getByText('Content 3')).toBeInTheDocument();
      expect(document.activeElement).toBe(screen.getByText('Tab 3'));
    });

    it('should skip disabled tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2" disabled>
              Tab 2 (Disabled)
            </Tab>
            <Tab value="tab3">Tab 3</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
            <TabPanel value="tab3">Content 3</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      // Right arrow should skip tab2 and go to tab3
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });

      expect(screen.getByText('Content 3')).toBeInTheDocument();
      expect(document.activeElement).toBe(screen.getByText('Tab 3'));
    });
  });

  describe('Disabled tabs', () => {
    it('should not allow clicking disabled tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2" disabled>
              Tab 2 (Disabled)
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
            <TabPanel value="tab2">Content 2</TabPanel>
          </TabPanels>
        </Tabs>
      );

      const disabledTab = screen.getByText('Tab 2 (Disabled)');
      expect(disabledTab).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(disabledTab);

      // Should still show Content 1
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });

  describe('Custom styling', () => {
    it('should accept className prop', () => {
      render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabList className="custom-tablist">
            <Tab value="tab1" className="custom-tab">
              Tab 1
            </Tab>
          </TabList>
          <TabPanels className="custom-panels">
            <TabPanel value="tab1" className="custom-panel">
              Content 1
            </TabPanel>
          </TabPanels>
        </Tabs>
      );

      expect(screen.getByRole('tablist').parentElement).toHaveClass('custom-tabs');
      expect(screen.getByRole('tablist')).toHaveClass('custom-tablist');
      expect(screen.getByRole('tab')).toHaveClass('custom-tab');
      expect(screen.getByRole('tabpanel')).toHaveClass('custom-panel');
    });
  });

  describe('Tab with icons', () => {
    it('should render tabs with icons', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabList>
            <Tab
              value="tab1"
              icon={<span data-testid="icon1">🏠</span>}
            >
              Home
            </Tab>
            <Tab
              value="tab2"
              icon={<span data-testid="icon2">⚙️</span>}
            >
              Settings
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Home Content</TabPanel>
            <TabPanel value="tab2">Settings Content</TabPanel>
          </TabPanels>
        </Tabs>
      );

      expect(screen.getByTestId('icon1')).toBeInTheDocument();
      expect(screen.getByTestId('icon2')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should warn if no defaultValue or value is provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <Tabs>
          <TabList>
            <Tab value="tab1">Tab 1</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab1">Content 1</TabPanel>
          </TabPanels>
        </Tabs>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Tabs: Either "value" or "defaultValue" must be provided.'
      );

      consoleSpy.mockRestore();
    });
  });
});
