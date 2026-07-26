import * as React from 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    value?: any;
    selected?: boolean;
  }
  namespace JSX {
    interface IntrinsicElements {
      'hd-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        type?: string;
        disabled?: boolean;
        placeholder?: string;
        value?: string | number;
        id?: string;
        name?: string;
        autocomplete?: string;
        onInput?: (event: any) => void;
        onChange?: (event: any) => void;
      };
      'hd-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        placeholder?: string;
        value?: string;
        id?: string;
        name?: string;
        autocomplete?: string;
        onInput?: (event: any) => void;
        onChange?: (event: any) => void;
        'data-disable-horizontal-resize'?: string;
      };
      'hd-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        type?: string;
        disabled?: boolean;
        onClick?: (event: any) => void;
      };
      'hd-slider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        min?: string | number;
        max?: string | number;
        value?: string | number;
        step?: string | number;
        name?: string;
        id?: string;
        disabled?: boolean;
        onInput?: (event: any) => void;
        onChange?: (event: any) => void;
      };
      'hd-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        checked?: boolean;
        disabled?: boolean;
        name?: string;
        id?: string;
        onChange?: (event: any) => void;
      };
      'hd-radio': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        checked?: boolean;
        disabled?: boolean;
        id?: string;
        onChange?: (event: any) => void;
      };
      'hd-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        checked?: boolean;
        disabled?: boolean;
        name?: string;
        id?: string;
        onChange?: (event: any) => void;
      };
      'hd-scrollbar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'hd-reveal': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-direction'?: string;
        'data-delay'?: string | number;
        'data-duration'?: string | number;
        'data-threshold'?: string | number;
      };
      'hd-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        placeholder?: string;
        value?: string | number;
        id?: string;
        name?: string;
        onChange?: (event: any) => void;
      };
      'hd-color-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
        id?: string;
        name?: string;
        onInput?: (event: any) => void;
        onChange?: (event: any) => void;
      };
      'hd-color-panel': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
        id?: string;
        onInput?: (event: any) => void;
        onChange?: (event: any) => void;
      };
      'hd-segment': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
        id?: string;
        name?: string;
        onChange?: (event: any) => void;
      };
      'hd-video': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        controls?: boolean;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
        'data-thickness'?: string;
        'data-color'?: string;
        'data-text-color'?: string;
        'data-radius'?: string;
        'data-width'?: string;
        'data-height'?: string;
      };
      'hd-video-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        controls?: boolean;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
        'data-thickness'?: string;
        'data-color'?: string;
        'data-text-color'?: string;
        'data-radius'?: string;
        'data-width'?: string;
        'data-height'?: string;
      };
    }
  }
}
