/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import * as ReactHookForm from 'react-hook-form';
import { AgentFormFields } from './AgentFormFields';
import {
  AGENT_FORM_DEFAULTS,
  type AgentFormValues,
} from '../validations';

jest.mock('erxes-ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const { Controller } =
    jest.requireActual<typeof ReactHookForm>('react-hook-form');

  const Container = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => <div {...props}>{children}</div>;
  const Label = ({
    children,
    ...props
  }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  );
  const Input = ReactModule.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >((props, ref) => <input ref={ref} {...props} />);
  const Textarea = ReactModule.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
  >((props, ref) => <textarea ref={ref} {...props} />);

  const Form = {
    Field: Controller,
    Item: Container,
    Label,
    Control: Container,
    Description: Container,
    Message: () => null,
  };

  const Alert = Object.assign(Container, {
    Title: Container,
    Description: Container,
  });
  const Card = Object.assign(Container, {
    Header: Container,
    Title: Container,
    Description: Container,
    Content: Container,
  });

  const RadioContext = ReactModule.createContext({
    value: '',
    onValueChange: () => undefined,
  });
  const RadioGroupRoot = ({
    value,
    onValueChange,
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <RadioContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup" {...props}>
        {children}
      </div>
    </RadioContext.Provider>
  );
  const RadioGroupItem = ({ value }: { value: string }) => {
    const context = ReactModule.useContext(RadioContext);

    return (
      <input
        type="radio"
        value={value}
        checked={context.value === value}
        onChange={() => context.onValueChange(value)}
      />
    );
  };
  const RadioGroup = Object.assign(RadioGroupRoot, {
    Item: RadioGroupItem,
  });

  const CollapsibleContext = ReactModule.createContext({
    open: false,
    setOpen: () => undefined,
  });
  const CollapsibleRoot = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => {
    const [open, setOpen] = ReactModule.useState(false);

    return (
      <CollapsibleContext.Provider value={{ open, setOpen }}>
        <div {...props}>{children}</div>
      </CollapsibleContext.Provider>
    );
  };
  const CollapsibleTrigger = ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { open, setOpen } = ReactModule.useContext(CollapsibleContext);

    return (
      <button
        {...props}
        onClick={(event) => {
          setOpen(!open);
          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  };
  const CollapsibleContent = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = ReactModule.useContext(CollapsibleContext);

    return open ? <div {...props}>{children}</div> : null;
  };
  const Collapsible = Object.assign(CollapsibleRoot, {
    TriggerButton: CollapsibleTrigger,
    TriggerIcon: Container,
    Content: CollapsibleContent,
  });

  const Switch = ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    />
  );

  return {
    Alert,
    Badge: Container,
    Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props} />
    ),
    Card,
    Collapsible,
    Form,
    Input,
    Label,
    RadioGroup,
    Separator: () => <hr />,
    Slider: () => <div />,
    Switch,
    Textarea,
  };
});
jest.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));


const translations: Record<string, string> = {
  'agent-settings-intro-title': 'Set up how this agent works',
  'agent-settings-selected-tools': 'Only selected operations',
  'agent-settings-all-tools': 'All available operations',
  'agent-settings-full-access-title': 'This agent has full erxes access',
  'agent-settings-advanced-title': 'Advanced model controls',
  'agent-settings-debug-label': 'Show tool activity in chat',
  'agent-settings-availability-label': 'Accept new conversations',
  'agent-settings-availability-on-description':
    'On: the agent can respond to bot webhook requests.',
  'agent-settings-availability-off-description':
    'Off: the agent stays configured but will not respond to bot webhook requests.',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) =>
    translations[i18nKey] ?? i18nKey,
}));

jest.mock('~/components/SelectProviderModel', () => ({
  SelectProvider: () => <div>Provider selector</div>,
  SelectModel: () => <div>Model selector</div>,
  useProviderOptions: () => ({ providers: [{ value: 'test' }] }),
}));

jest.mock('../hooks/useAvailableErxesTools', () => ({
  useAvailableErxesTools: () => ({ operations: [], loading: false }),
}));

jest.mock('./AgentToolPicker', () => ({
  AgentToolPicker: () => <div>Selected operation picker</div>,
}));

jest.mock('./AgentVisibilitySectionFields', () => ({
  AgentVisibilitySectionFields: () => null,
}));

const TestForm = () => {
  const form = ReactHookForm.useForm<AgentFormValues>({
    defaultValues: AGENT_FORM_DEFAULTS,
  });

  return (
    <ReactHookForm.FormProvider {...form}>
      <form>
        <AgentFormFields form={form} />
      </form>
    </ReactHookForm.FormProvider>
  );
};

describe('AgentFormFields guided settings', () => {
  it('makes access choices explicit and progressively reveals advanced controls', () => {
    render(<TestForm />);

    expect(screen.getByText('Set up how this agent works')).toBeTruthy();
    expect(
      screen.getByText('This agent has full erxes access'),
    ).toBeTruthy();
    expect(screen.queryByText('Selected operation picker')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: /Only selected operations/i }));

    expect(screen.getByText('Selected operation picker')).toBeTruthy();
    expect(
      screen.queryByText('This agent has full erxes access'),
    ).toBeNull();
    expect(screen.queryByText('Show tool activity in chat')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: /Advanced model controls/i }),
    );

    expect(screen.getByText('Show tool activity in chat')).toBeTruthy();
  });

  it('explains the current availability state instead of showing an ambiguous toggle', () => {
    render(<TestForm />);

    expect(
      screen.getByText('On: the agent can respond to bot webhook requests.'),
    ).toBeTruthy();

    fireEvent.click(screen.getAllByRole('switch')[0]);

    expect(
      screen.getByText(
        'Off: the agent stays configured but will not respond to bot webhook requests.',
      ),
    ).toBeTruthy();
  });
});
