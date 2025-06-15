import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  console.log("🎯 Toaster component rendered");
  
  return (
    <Sonner 
      position="bottom-right"
      expand={true}
      richColors={true}
      closeButton={true}
      duration={4000}
      style={{
        zIndex: 99999
      }}
      toastOptions={{
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          padding: '16px',
          minWidth: '300px',
          maxWidth: '500px'
        },
        className: 'sonner-toast'
      }}
    />
  )
}

export { Toaster }
