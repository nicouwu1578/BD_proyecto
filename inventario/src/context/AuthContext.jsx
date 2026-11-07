
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [session, setSession] = useState(null)
 
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [cargandoUsuario, setCargandoUsuario] = useState(false)

  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargandoSesion(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
    })

 
    return () => data.subscription.unsubscribe()
  }, [])

  // 2) Cada vez que cambia la sesión, se busca la fila en tu tabla "usuario"
  //    cuyo auth_id es el id de la cuenta que inició sesión.
  useEffect(() => {
    if (!session) {
      setUsuario(null)
      return
    }
    let cancelado = false
    setCargandoUsuario(true)
    supabase
      .from('usuario')
      .select('id_usuario, usuario, rol')
      .eq('auth_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('Error cargando el usuario:', error)
        setUsuario(data ?? null)
        setCargandoUsuario(false)
      })
    return () => {
      cancelado = true
    }
  }, [session])

  async function iniciarSesion(correo, contrasena) {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    })
    return error // null si todo salió bien
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  const valor = {
    session,
    usuario, // { id_usuario, usuario, rol } o null si la cuenta no está vinculada
    rol: usuario?.rol ?? null,
    correo: session?.user?.email ?? '',
    cargando: cargandoSesion || cargandoUsuario,
    iniciarSesion,
    cerrarSesion,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
