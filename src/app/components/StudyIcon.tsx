export type StudyIconName =
  | 'arrow'
  | 'bolt'
  | 'check'
  | 'deck'
  | 'edit'
  | 'lock'
  | 'search'
  | 'spark'
  | 'upload'
  | 'x';

export function StudyIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: StudyIconName;
  className?: string;
}) {
  const paths = {
    arrow: <path d='m9 18 6-6-6-6' />,
    bolt: <path d='m13 2-9 12h7l-1 8 9-12h-7l1-8Z' />,
    check: <path d='m5 12 4 4L19 6' />,
    deck: <path d='M4 6h16M5 10h14M6 14h12M7 18h10' />,
    edit: <path d='m12 20 8-8-4-4-8 8-1 5 5-1ZM14 10l4 4' />,
    lock: <path d='M7 10V7a5 5 0 0 1 10 0v3m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z' />,
    search: <path d='m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z' />,
    spark: <path d='m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Zm7 15 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z' />,
    upload: <path d='M12 16V4m0 0L7 9m5-5 5 5M5 20h14' />,
    x: <path d='M18 6 6 18M6 6l12 12' />,
  };

  return (
    <svg
      aria-hidden='true'
      className={className}
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      {paths[name]}
    </svg>
  );
}
