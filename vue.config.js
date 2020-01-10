const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');// 代码压缩


const IS_PROD = ['production','prod'].includes(process.env.NODE_ENV);
const env = process.env.NODE_ENV;
const resolve = dir => {
    return path.join(__dirname,dir);
}
//线上打包路径，
const BASE_URL = './'
const SVG_ICON_PATH = 'src/icons/svg';  // 增加svgIcon图标目录
const OUTPUT_DIR = process.env.VUE_APP_OUTPUTDIR
module.exports = {
    // publicPath:BASE_URL,//publicPath取代了baseUrl
    publicPath:'./',//publicPath取代了baseUrl
    outputDir:OUTPUT_DIR,//打包的生产环境的目录
    assetsDir:'assets',//生成的静态资源路径，默认放在outputDir (js、css、img、fonts)  (相对于 outputDir 的) 目录 
    indexPath:'./index.html',//指定生成的index.html输入路径， (相对于 outputDir)。也可以是一个绝对路径
    // page:undefined,//构建多页
    // runtimeCompiler: true, //关键点在这  原来的 Compiler 换成了 runtimeCompiler
    productionSourceMap:false,//开启生产环境的sourcemap?false提高构建速度
    /* 默认情况下，生成的静态资源在它们的文件名中包含了 hash 以便更好的控制缓存，你可以通过将这个选项设为 false 来关闭文件名哈希。(false的时候就是让原来的文件名不改变) */
    //  filenameHashing: false,
    configureWebpack: config => {
        if (IS_PROD) {
          config.optimization.minimizer[0].options.terserOptions.compress.warnings = false
          config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
          config.optimization.minimizer[0].options.terserOptions.compress.drop_debugger = true
          config.optimization.minimizer[0].options.terserOptions.compress.pure_funcs = ['console.log']
        } else {
          // 为开发环境修改配置...
        }
        // 配置插件statr
        let plugins = [
          new HtmlWebpackPlugin({
            template: './public/index.html',
            favicon: resolve('./public/favicon.ico'),
            title: '贷款计算器',
            hash: true,
            minify: {
              removeAttributeQuotes: false, // 去除双引号(实际开发改为trur)
              collapseWhitespace: false, // 合并代码到一行(实际开发改为trur)
            }
          }),
        //     new UglifyJsPlugin({
        //         uglifyOptions: {
        //             //生产环境自动删除console
        //             compress: {
        //                 warnings: false, // 若打包错误，则注释这行
        //                 drop_debugger: true,
        //                 drop_console: true,
        //                 pure_funcs: ['console.log']
        //             }
        //         },
        //         sourceMap: false,
        //         parallel: true
        //     })
        ];
        config.plugins = [...config.plugins, ...plugins];
        // 公共代码抽离
        config.optimization = {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        chunks: 'all',
                        test: /node_modules/,
                        name: 'vendor',
                        minChunks: 1,
                        maxInitialRequests: 5,
                        minSize: 0,
                        priority: 100
                    },
                    common: {
                        chunks: 'all',
                        test: /[\\/]src[\\/]js[\\/]/,
                        name: 'common',
                        minChunks: 2,
                        maxInitialRequests: 5,
                        minSize: 0,
                        priority: 60
                    },
                    styles: {
                        name: 'styles',
                        test: /\.(sa|sc|c)ss$/,
                        chunks: 'all',
                        enforce: true
                    },
                    runtimeChunk: {
                        name: 'manifest'
                    }
                }
            }
        }
        // 配置插件end
        performance: {
          hints:false
        }  
    },
    // webpack配置
    // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
    chainWebpack:config => {
        const env = process.env.NODE_ENV;
        config.resolve.symlinks(true);//修复HMR失效
        // 配置别名
        config.extensions = ['.js', '.vue','.json','.ts', '.tsx'];
        config.resolve.alias
          .set('@', path.resolve('src'))
          .set('api', path.resolve(__dirname, 'src/api'))
          .set('utils', path.resolve(__dirname, 'src/utils'))
          .set('_c', resolve('src/components'))

        
        config.module
        .rule('images')
        .test(/\.(png|jpe?g|gif|svg|webp)(\?.*)?$/)
        .exclude
            .add(path.resolve(__dirname, SVG_ICON_PATH))
            .end()
        // .use('image-webpack-loader')
        //     .loader('image-webpack-loader')
        //     .options({ bypassOnDebug: true })
        //     .end()
        
        //打包分析
        if(process.env.IS_ANALYZ){
            config.plugin('webpack-report')
              .use(BundleAnalyzerPlugin,[{
                  analyzerMode:'static',
              }])
        }
  
          // 替换 svg 的处理
      const svgRule = config.module.rule('svg')
  
      // 清除已有的所有 loader。删除默认配置中对svg的处理
      // 如果你不这样做，接下来的 loader 会附加在该规则现有的 loader 之后。
      svgRule.uses.clear()
  
      // 添加要替换的 loader
      svgRule
        .test(/\.(svg)(\?.*)?$/)
        .include
          .add(path.resolve(__dirname, SVG_ICON_PATH))
          .end()
          .use('svg-sprite-loader')
          .loader('svg-sprite-loader')
          .options({
            symbolId: 'icon-[name]'
          })
          .end()
          .use('svgo-loader')
          .loader('svgo-loader')
          .options({
            plugins: [
              {removeTitle: true},
              {convertColors: {shorthex: false}},
              {convertPathData: false}
            ]
          });
          if(env === 'production'){
            // dllReference(config)
          }
    },
    css:{
        requireModuleExtension: true, // true表示启用 CSS modules
        extract: true, // 是否使用css分离插件
        sourceMap: false, // 开启 CSS source maps?
        loaderOptions: {} // css预设器配置项
    },
    // 配置开发服务器
    devServer:{
        contentBase: path.join(__dirname, 'dist'),
        hot: true,
        host: 'localhost',
        port: 8080,
        // compress: true, // 自动压缩
        open: true, // 自动打开浏览器
        proxy: {
          '/api': {
            target: 'http://11.111.1.22:9711', // 接口的域名
            // secure: false,  // 如果是https接口，需要配置这个参数
            changeOrigin: false, //
            // pathRewrite: {//本应用不能放出来
            //   '^/api': 'http://10/192.171.181:8081'
            // }
          },
          '/mock':{
            target:'http://11.113.0.103:3000',//
          },
        },
        // proxy: 'https://www.easy-mock.com' // 设置代理
    },
    // 第三方插件配置
    pluginOptions: {
      // ...
    }
}