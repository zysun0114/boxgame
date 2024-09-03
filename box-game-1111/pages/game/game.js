// pages/game/game.js
var data = require("../../utils/data.js");

var map = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0]
];
var box = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0]
];
var w = 40;
// 人物的行与列
var row = 0;
var col = 0;
// 用于存储每一步的状态
var history = []; // 状态记录栈

Page({
  initMap: function(level) {
    let mapData = data.maps[level];
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        box[i][j] = 0;
        map[i][j] = mapData[i][j];

        if (mapData[i][j] == 4) {
          box[i][j] = 4;
          map[i][j] = 2;
        } else if (mapData[i][j] == 5) {
          map[i][j] = 2;
          row = i;
          col = j;
        }
      }
    }
    // 清空历史记录
    history = [];
    // 保存初始状态
    this.saveState();
  },
  
  drawCanvas: function() {
    let ctx = this.ctx;
    ctx.clearRect(0, 0, 320, 320);
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        let img = "02.jpg";
        if (map[i][j] == 1) {
          img = "01.jpg";
        } else if (map[i][j] == 3) {
          img = "03.jpg";
        }

        ctx.drawImage("/images/icons/" + img, j * w, i * w, w, w);

        if (box[i][j] == 4) {
          ctx.drawImage("/images/icons/04.jpg", j * w, i * w, w, w);
        }
      }
    }
    ctx.drawImage("/images/icons/05.png", col * w, row * w, w, w);
    ctx.draw();
  },

  saveState: function() {
    // 保存当前的地图状态、箱子状态和人物位置
    history.push({
      map: JSON.parse(JSON.stringify(map)),
      box: JSON.parse(JSON.stringify(box)),
      row: row,
      col: col
    });
  },

  undo: function() {
    // 如果有历史状态可以回退
    if (history.length > 1) {
      history.pop(); // 弹出当前状态
      let lastState = history[history.length - 1];
      // 恢复到上一步状态
      map = JSON.parse(JSON.stringify(lastState.map));
      box = JSON.parse(JSON.stringify(lastState.box));
      row = lastState.row;
      col = lastState.col;
      this.drawCanvas();
    } else {
      wx.showToast({
        title: '已经是第一步无法回退',
        icon: 'none'
      });
    }
  },

  movePlayer: function(deltaRow, deltaCol) {
    let newRow = row + deltaRow;
    let newCol = col + deltaCol;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      if (map[newRow][newCol] != 1 && box[newRow][newCol] != 4) {
        row = newRow;
        col = newCol;
        this.saveState(); // 保存移动后的状态
      } else if (box[newRow][newCol] == 4) {
        let nextRow = newRow + deltaRow;
        let nextCol = newCol + deltaCol;
        if (nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8) {
          if (map[nextRow][nextCol] != 1 && box[nextRow][nextCol] != 4) {
            box[nextRow][nextCol] = 4;
            box[newRow][newCol] = 0;
            row = newRow;
            col = newCol;
            this.saveState(); // 保存推箱子后的状态
          }
        }
      }
      this.drawCanvas();
      this.checkWin();
    }
  },

  up: function() {
    this.movePlayer(-1, 0);
  },
  down: function() {
    this.movePlayer(1, 0);
  },
  left: function() {
    this.movePlayer(0, -1);
  },
  right: function() {
    this.movePlayer(0, 1);
  },
  
  isWin: function() {
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        if (box[i][j] == 4 && map[i][j] != 3) {
          return false;
        }
      }
    }
    return true;
  },
  
  checkWin: function() {
    if (this.isWin()) {
      if (this.data.level < data.maps.length) {  // 判断是否还有下一关
        wx.showModal({
          title: "恭喜",
          content: "进入下一关",
          showCancel: false,
          success: () => {
            this.setData({
              level: this.data.level + 1
            });
            this.initMap(this.data.level - 1);  // 初始化下一关地图
            this.drawCanvas();  // 绘制地图
          }
        });
      } else {
        wx.showModal({
          title: "恭喜",
          content: "已完成所有关卡，返回首页",
          showCancel: false,
          success: () => {
            wx.navigateBack();  // 返回首页
          }
        });
      }
    }
  },
  
  restartGame: function() {
    this.initMap(this.data.level - 1);
    this.drawCanvas();
  },

  skipLevel: function() {
    if (this.data.level < data.maps.length) {
      this.setData({
        level: this.data.level + 1
      });
      this.initMap(this.data.level - 1);  // 初始化下一关地图
      this.drawCanvas();  // 绘制地图
    } else {
      wx.showModal({
        title: "提示",
        content: "已经是最后一关，无法跳过",
        showCancel: false
      });
    }
  },
  
  /**
   * 页面的初始数据
   */
  data: {
    level: 1  // 初始化关卡数
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let level = options.level;
    this.setData({
      level: parseInt(level) + 1
    });
    this.ctx = wx.createCanvasContext('myCanvas');
    this.initMap(level);
    this.drawCanvas();
  }
});
