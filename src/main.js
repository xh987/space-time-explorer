import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createStore } from './stores'

// Vant UI
import { 
  Button, 
  NavBar, 
  Icon, 
  Cell, 
  CellGroup, 
  Tag, 
  Popup,
  Field,
  Progress,
  Badge,
  Radio,
  RadioGroup,
  Loading,
  Dialog,
  Checkbox,
  Switch,
  Slider
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

// 注册Vant组件
app.use(Button)
app.use(NavBar)
app.use(Icon)
app.use(Cell)
app.use(CellGroup)
app.use(Tag)
app.use(Popup)
app.use(Field)
app.use(Progress)
app.use(Badge)
app.use(Radio)
app.use(RadioGroup)
app.use(Loading)
app.use(Dialog)
app.use(Checkbox)
app.use(Switch)
app.use(Slider)

// 使用路由和状态管理
app.use(router)
app.use(createStore())

app.mount('#app')
