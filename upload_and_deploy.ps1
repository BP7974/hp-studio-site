
# 防止脚本闪退，遇到错误立即停止并显示
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 配置区
$server = "your.server.ip"
$user = "admin"
$remoteDir = "/home/admin/hp-studio"
$localDir = "D:\\CODE\\hp-studio-site"

# 创建窗体
$form = New-Object System.Windows.Forms.Form
$form.Text = "一键上传并部署"
$form.Size = New-Object System.Drawing.Size(400,260)
$form.StartPosition = "CenterScreen"

# 日志框
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.Size = New-Object System.Drawing.Size(360,120)
$logBox.Location = New-Object System.Drawing.Point(10,10)
$logBox.ReadOnly = $true
$form.Controls.Add($logBox)

# 进度条
$progress = New-Object System.Windows.Forms.ProgressBar
$progress.Location = New-Object System.Drawing.Point(10,140)
$progress.Size = New-Object System.Drawing.Size(360,20)
$form.Controls.Add($progress)

# 按钮
$button = New-Object System.Windows.Forms.Button
$button.Text = "开始上传并部署"
$button.Location = New-Object System.Drawing.Point(140,170)
$button.Size = New-Object System.Drawing.Size(120,30)
$form.Controls.Add($button)

# 执行逻辑

$button.Add_Click({
    try {
        $logBox.AppendText("1. 本地构建中...`r`n")
        $progress.Value = 10
        Set-Location $localDir
        $build = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm ci && npm run build" -NoNewWindow -Wait -PassThru
        if ($build.ExitCode -ne 0) {
            $logBox.AppendText("本地构建失败！`r`n")
            return
        }
        $logBox.AppendText("2. 上传代码到服务器...`r`n")
        $progress.Value = 40
        $scp = Start-Process -FilePath "scp.exe" -ArgumentList "-r * $user@$server:`${remoteDir}`" -NoNewWindow -Wait -PassThru
        if ($scp.ExitCode -ne 0) {
            $logBox.AppendText("上传失败！请检查 scp 配置。`r`n")
            return
        }
        $logBox.AppendText("3. 远程自动部署...`r`n")
        $progress.Value = 70
        $sshCmd = "cd `${remoteDir}` && npm ci && npm run build && pm2 stop all && pm2 delete all && pm2 start npm --name hp-studio -- start --cwd `${remoteDir}`"
        $ssh = Start-Process -FilePath "ssh.exe" -ArgumentList "$user@$server `"$sshCmd`"" -NoNewWindow -Wait -PassThru
        if ($ssh.ExitCode -ne 0) {
            $logBox.AppendText("远程部署失败！请检查 ssh 配置。`r`n")
            return
        }
        $progress.Value = 100
        $logBox.AppendText("全部完成！`r`n")
    } catch {
        $logBox.AppendText("发生错误：$_`r`n")
    }
    # 脚本执行完后暂停，防止窗口自动关闭
    [void][System.Windows.Forms.MessageBox]::Show("操作已完成或发生错误，点击确定关闭窗口。", "提示")
    Read-Host "按回车键退出"
})

# 显示窗体
$form.Topmost = $true
$form.Add_Shown({$form.Activate()})
[void]$form.ShowDialog()